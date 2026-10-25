echo "开始构建 web 版本"
echo "当前分支: $1"
echo "当前 common 分支: $2"
echo "是否构建 AB 包: $3"
echo "环境变量: $4"

# 安装 node 依赖
pnpm i

# 提取hash值的函数
extract_hash_values() {
  local base_path=$1
  local package_name=$2

  echo "提取${package_name}包hash值..." >&2
  local import_map_hash=$(ls ${base_path}/src/import-map.*.json | sed 's/.*import-map\.\([^.]*\)\.json/\1/')
  local index_hash=$(ls ${base_path}/index.*.js | sed 's/.*index\.\([^.]*\)\.js/\1/')

  echo "${package_name}包 import-map hash: $import_map_hash" >&2
  echo "${package_name}包 index hash: $index_hash" >&2

  echo "$import_map_hash $index_hash"
}

# 注入hash配置到HTML的函数
inject_hash_config() {
  local a_import_map_hash=$1
  local a_index_hash=$2
  local b_import_map_hash=$3
  local b_index_hash=$4

  echo "注入hash值到HTML... $a_import_map_hash $a_index_hash $b_import_map_hash $b_index_hash"

  # 创建临时的hash配置脚本内容到临时文件
  sudo tee /tmp/hash_config.js > /dev/null << EOF
// 构建时自动生成的hash配置
window.BUILD_HASHES = {
  A: {
    importMap: "$a_import_map_hash",
    index: "$a_index_hash"
  },
  B: {
    importMap: "$b_import_map_hash",
    index: "$b_index_hash"
  }
};
console.log('Build hashes loaded:', window.BUILD_HASHES);
EOF

  # 将hash配置注入到HTML中，替换{{ buildHashes }}占位符
  sudo sed -i '' "/{{ buildHashes }}/r /tmp/hash_config.js" build/web-mobile/index.html
  sudo sed -i '' "s/{{ buildHashes }}/<script>/" build/web-mobile/index.html
  sudo sed -i '' "/window.BUILD_HASHES = {/,/};/s/^/  /" build/web-mobile/index.html
  sudo sed -i '' "s/console.log('Build hashes loaded:', window.BUILD_HASHES);/console.log('Build hashes loaded:', window.BUILD_HASHES);\n<\/script>/" build/web-mobile/index.html
}

# 将B包文件平铺到A包路径下
flatten_b_package() {
  echo "将B包文件平铺到A包路径下..."

  local b_package_dir="build/web-mobile/B/web-mobile"
  local a_package_dir="build/web-mobile"

  # 递归遍历B包目录
  find "$b_package_dir" -type f | while read -r b_file; do
    # 计算相对路径
    local relative_path="${b_file#$b_package_dir/}"
    local target_path="$a_package_dir/$relative_path"

    # 检查目标文件是否存在
    if [ -f "$target_path" ]; then
      # 文件存在，比较hash
      local b_hash=$(md5sum "$b_file" | cut -d' ' -f1)
      local a_hash=$(md5sum "$target_path" | cut -d' ' -f1)

      if [ "$b_hash" != "$a_hash" ]; then
        # hash不同，复制B包文件到A包路径
        echo "复制文件 (hash不同): $relative_path"
        sudo cp "$b_file" "$target_path"
      else
        echo "跳过文件 (hash相同): $relative_path"
      fi
    else
      # 目标文件不存在，直接复制
      echo "复制新文件: $relative_path"
      # 确保目标目录存在
      sudo mkdir -p "$(dirname "$target_path")"
      sudo cp "$b_file" "$target_path"
    fi
  done

  echo "B包文件平铺完成"
}

# 根据第三个参数决定构建方式
if [ "$3" = "true" ]; then
  echo "开始构建AB包..."

  # 构建A包 - 切换到 $1.A 分支
  echo "切换到 $1.A 分支构建A包..."
  git checkout $1.A --force
  git reset --hard origin/$1.A

	# 切换分支后执行预构建
	node build-sh/pre-build.js $4

  sudo /Applications/Cocos/Creator/3.8.5/CocosCreator.app/Contents/MacOS/CocosCreator --project ./ --build "configPath=./buildConfig_web-mobile_A.json"

  # 构建B包 - 切换到 $1.B 分支
  echo "切换到 $1.B 分支构建B包..."
  git checkout $1.B --force
  git reset --hard origin/$1.B

	# 切换分支后执行预构建
	node build-sh/pre-build.js $4

  sudo /Applications/Cocos/Creator/3.8.5/CocosCreator.app/Contents/MacOS/CocosCreator --project ./ --build "configPath=./buildConfig_web-mobile_B.json"

  # 提取A包和B包的hash值
  # 在文件平铺前提取A包hash
  a_hashes=$(extract_hash_values "build/web-mobile" "A")

  # 将B包文件平铺到A包路径下
  flatten_b_package

  # 文件平铺后，从B包目录提取B包hash
  b_hashes=$(extract_hash_values "build/web-mobile/B/web-mobile" "B")

  # 解析hash值
  a_import_map_hash=$(echo $a_hashes | tail -1 | cut -d' ' -f1)
  a_index_hash=$(echo $a_hashes | tail -1 | cut -d' ' -f2)
  b_import_map_hash=$(echo $b_hashes | tail -1 | cut -d' ' -f1)
  b_index_hash=$(echo $b_hashes | tail -1 | cut -d' ' -f2)

  # 注入hash配置
  inject_hash_config "$a_import_map_hash" "$a_index_hash" "$b_import_map_hash" "$b_index_hash"

  echo "构建完成！Hash配置已直接注入到 build/web-mobile/index.html"
else
  echo "构建单包..."

	# 构建默认包
  echo "切换到 $1 分支构建默认包..."
  git checkout $1 --force
  git reset --hard origin/$1

	# 切换分支后执行预构建
	node build-sh/pre-build.js $4

  # 构建单包 - 使用当前分支
  sudo /Applications/Cocos/Creator/3.8.5/CocosCreator.app/Contents/MacOS/CocosCreator --project ./ --build "configPath=./buildConfig_web-mobile.json"

	# 构建默认包
  echo "切换到 $1 分支构建默认包..."
  git checkout $1 --force
  git reset --hard origin/$1

	# 切换分支后执行预构建
	node build-sh/pre-build.js $4

  # 提取单包的hash值
  single_hashes=$(extract_hash_values "build/web-mobile" "单包")

  # 解析hash值
    # 解析hash值
  single_import_map_hash=$(echo $single_hashes | tail -1 | cut -d' ' -f1)
  single_index_hash=$(echo $single_hashes | tail -1 | cut -d' ' -f2)

  # 注入hash配置（A包和B包使用相同的hash值）
  inject_hash_config "$single_import_map_hash" "$single_index_hash" "$single_import_map_hash" "$single_index_hash"

  echo "单包构建完成！Hash配置已直接注入到 build/web-mobile/index.html"
fi
