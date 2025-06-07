## Exence 1.1.0
<img src="https://img.shields.io/github/contributors/imkysou/exence" /> <img src="https://img.shields.io/badge/license-MIT%20License-green" /> <img src="https://img.shields.io/github/commit-activity/m/imkysou/exence" />

Exence 是一个基于 `Node.js` 编写的，专为MC服主而生，且可以为安装了类似于 [AuthMeReloaded](https://www.spigotmc.org/resources/authmereloaded.6269/) 的 Minecraft 服务器提供网站上注册的功能。

**重要：Exence官方会不定期更新模板，建议大家一直使用最新版本的Exence以获得更美观的UI和更完善的功能。**

#### 基础使用
1. 前往 Github Releases 下载最新版本的 Exence;
2. 解压后，使用 `Visual Studio Code` 或 `Notepad--` 打开 `exence.global.js` 文件;
3. 设置你需要更改的配置（其中所有选项已通过注释写出）;
4. 通过`node index`启动程序；
5. 浏览器打开 `http://服务器IP/后台访问页面安全路径`(后台地址在配置文件中给出，默认为exence)，如果是云服务器，则可能需要开放安全组；
6. 输入用户名admin，默认密码123456进行登录；
7. 在更改密码处，设置新的密码（强烈建议设置）；
8. 更改服务器选项和模板数据，即可食用。

*Tips: 大部分人看到模板数据可能会迷惑，建议查看文件夹下的/themes/classic/README.md文件，内有详细的说明*

#### 进阶使用
##### 使用 Nginx/Apache 反代（宝塔面板）
1. 在服务器安装宝塔面板；
2. 在本项目的exence.global.js中，将ssl的enable改为false，将默认端口改为81或其他不为80的端口，将remoteIP的mothod改为`proxy`；
3. 在宝塔面板中，选择【网站】，点击上方的【反向代理】；
4. 反向代理的后端地址填写为81或你刚刚设置的端口；
5. 在

##### 不使用反向代理的情况下，安装SSL证书
1. 申请SSL证书；
2. 将key粘贴到/saves/ssl/private.key，将cert粘贴到/saves/ssl/certificate.crt；
3. 在exence.global.js中，将ssl的enable改为true，将默认端口改为443；
4. 若要启用http自动跳转https，将force_https改为true

##### 套Cloudflare使用
1. 启用Cloudflare；
2. 在exence.global.js中，将remoteIP的mothod改为`Header`;
3. 将remoteIP的Header改为`CF-Connecting-IP`（默认就是）;

#### 自定义模板

1. 在`/themes`文件夹下，创建一个新文件夹，文件夹名即模版名；
2. 在exence.global.js中，更改`theme`为刚刚的模版名；
3. 启动项目；
4. 在你刚刚创建的模板文件夹中，更改你的模板。

##### 模板参数
在任意纯文本文件中，使用<%=参数名=>来作为参数，例如您在后台中配置了：
```
qq:123456
```
若您的模板中，有：
```
<p>我的QQ：<%=qq=></p>
```
则最终显示为：
```
<p>我的QQ：123456</p>
```

##### 常用API
常用API较为简单，一般只有两个，大家直接通过themes/classic/register.html下的script标签即可发现其中端倪。由于自定义模板不是重要内容，此处不多做介绍。