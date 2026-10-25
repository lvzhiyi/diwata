echo "开始构建 web 版本"
echo "当前分支: $0 $1"
echo "当前 common 分支: $0 $2"
echo "当前环境: $0 $3"

# 安装 node 依赖
pnpm i

node build-sh/pre-build.js $3

# 构建产物
sudo /Applications/Cocos/Creator/3.8.5/CocosCreator.app/Contents/MacOS/CocosCreator --project ./ --build "configPath=./buildConfig_web-mobile.json"
# echo "当前目录: $(pwd) $(ls)"
# # 替换 index.html 中的资源路径为 CDN
# cocosjsCDN="https://cocos-bundle.makillingslot.com"
# sudo sed -i '' 's#src/polyfills\.bundle\.5adbf\.js#'"$cocosjsCDN"'/src/polyfills\.bundle\.5adbf\.js#' build/web-mobile/index.html
# sudo sed -i '' 's#src/system\.bundle\.543e6\.js#'"$cocosjsCDN"'/src/system\.bundle\.543e6\.js#' build/web-mobile/index.html

# # 替换 import-map.json 中的资源路径为 CDN
# sudo sed -i '' 's#src/import-map\.[a-zA-Z0-9]*\.json#'"$cocosjsCDN"'/src/import-map.cc07b.json#' build/web-mobile/index.html
