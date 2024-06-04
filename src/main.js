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
window.addEventListener('keydown', event => {
	const {code, ctrlKey,shiftKey, altKey} = event;
	if (code === Config.code && ctrlKey === Config.ctrlKey && shiftKey === Config.shiftKey && altKey === Config.altKey) {
		const focusNode = document.body.querySelector('*:focus');
		if (!focusNode) {
			Panel.toggle();
		}
	}
});


// Panel.open();











