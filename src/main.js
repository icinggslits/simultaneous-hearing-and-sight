import './style.css';
import Config from './config.js';
import {clog, Convert, createNode, mouseDrag, barDrag, formatTime, triggerBuilder, debugCapture} from './unit.js';
import Panel from './panel.js';
import externalVideoHub from './externalVideoHub.js';
import './bilibiliPlayerVideoEvent.js';
import './replyList.js';

/**
 * 基准点
 * @typedef referencePoint
 * @type {object}
 * @property {number} originalTime
 * @property {number} mappingTime
 */

/**
 * 视频挂载配置数据v1
 * @typedef externalVideo1
 * @type {object}
 * @property {string} versions - 版本号
 * @property {referencePoint[]} referencePointList - 基准点列表
 */

/**
 * 拖拽信息对象
 * @typedef DragInfo
 * @type {object}
 * @property {number} original_x - 原始x
 * @property {number} original_y - 原始y
 * @property {number} diff_x -差值x
 * @property {number} diff_y -差值y
 * @property {number} x - 当前光标的x坐标
 * @property {number} y - 当前光标的y坐标
 */

/**
 * 拖拽信息对象回调
 * @callback dragInfoCallback
 * @param {DragInfo} dragInfo
 */


/*
 * 本脚本使用Vite构建，源码见...
 *
 *
 */




// 面板开启快捷键
window.addEventListener('keydown', (event) => {
	const {key, ctrlKey,shiftKey, altKey} = event;
	if (key === Config.key && ctrlKey === Config.ctrlKey && altKey === Config.altKey) {
		Panel.toggle();
	}
});


// Panel.open();











