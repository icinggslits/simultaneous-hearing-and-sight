# B站录播同步视听

在B站视频内外挂本地视频的油猴脚本，主要用于看录播时和主播同步看B站直播不能放出画面的视频（同步视听/同步试听），比如动画、电影。

油猴脚本：https://greasyfork.org/zh-CN/scripts/487964

## 使用说明

- 面板开关：`Shift` +`P`

- 时间轴和音量都通过滚轮调节，按住`Shift`改变滚轮调节数值的幅度；时间轴的毫秒可以通过按住`Shift`+`Alt`进一步改变数值调节的幅度。
- 设定外挂视频的轴、位置和大小：新建外挂视频然后选择本地视频文件（.mp4, .mkv, .flv格式）后才可以点击编辑按钮；编辑一个外挂视频时，可以拖动和通过右下角小方块调节大小；当外挂视频达到“网站视频”轴的一个时间戳时，外挂视频从“挂载视频”开始播放。
- 复制配置按钮：复制当前编辑的外挂视频配置到剪切板，配置文本包含了轴、位置和大小信息。
- 通过配置文本导入：打开面板并位于列表页，通过粘贴快捷键`Ctrl`+`V`，完成导入。
- B站视频评论分享配置文本：视频评论里出现的配置文本可以直接点击，点击会导入该配置并打开面板。

## 注意

- 编辑时间轴时，如果出现异常，检查B站视频当前时间位置是否处于外挂视频播放的时间轴范围。
- 如果外挂视频出现黑屏等异常情况，跳转、暂停再播放可能能恢复正常。
- 以Edge浏览器为例（休眠网页功能），疑似重新回到休眠后网页后，外挂视频概率音频能正常播放但画面不能正常显示。重新选择本地文件可以恢复正常。

## 后话

测试时发现实际调节外挂视频的轴很难对得上B站视频的轴，即使对上轴，过几分钟可能又会有偏差。如果把外挂视频的音量调低至和B站视频同步视听视频的音量差不多时，非常容易听出音频错位。查了一下人耳对相同但错位的音频的辨识程度，大概需要低于20毫秒人耳才听不出差异。这个精度要求对于浏览器环境的JS感觉是遇到了性能问题，也可能是设计问题，还有一处地方理论该优化但还没有处理。总之最后的效果自己不太满意，不过还是觉得发布比不发布好，有好过没有，况且把外挂视频音量调高，效果可能也还算可以。