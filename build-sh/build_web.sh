echo "开始构建 web 版本"
echo "当前分支: $0 $1"

# 安装 node 依赖
pnpm i

# 拉取子模块
rm -rf assets/activity
rm -rf assets/common
git submodule update --init

# 强制拉取并覆盖本地分支
cd assets/activity
git fetch --all --prune    # 清空本地缓存并重新拉取
git checkout $1 --force    # 强制切换到 develop 分支
git reset --hard origin/$1 # 对齐本地代码与远程 develop 分支
cd ../../



cd assets/common
git fetch --all --prune
git checkout $1 --force
git reset --hard origin/$1
cd ../../

# 预构建
node build-sh/pre-build.js $3

# 构建产物
sudo /Applications/Cocos/Creator/3.8.5/CocosCreator.app/Contents/MacOS/CocosCreator --project ./ --build "configPath=./buildConfig_web-mobile.json"
