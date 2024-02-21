import {clog, createNode, userSelectFile} from './unit.js';
import MeasuringBlock from './MeasuringBlock.js';
import externalVideoHub from './externalVideoHub.js';
import NumberEditor from './NumberEditor.js';
import measuringBlock from './MeasuringBlock.js';
import Config from './config.js';

/**
 * 选择视频文件时的回调
 * @callback videoInputCallback
 * @param {{videoFileUrl: string, file: File}} videoInputInfo
 */

const videoInputCallbackAttr = Symbol();
const videoEditCallbackAttr = Symbol();
const videoDeleteCallbackAttr = Symbol();
const bindMeasuringBlockAttr = Symbol();

const ListContentLine = {
	/**
	 *
	 * @param contentLine
	 * @return {boolean}
	 */
	is(contentLine) {
		return !!contentLine?.classList?.contains('content_line')
	},

	/**
	 *
	 * @param measuringBlock - 绑定的measuringBlock
	 */
	create(measuringBlock) {
		const contentLine = createNode(`
				<div class="content_line">
					<div class="content_line_name">视频${document.querySelectorAll('.content_line').length + 1}</div>
					<div class="content_line_videoInput">点击选择视频源</div>
					<div class="content_line_volume"></div>
					<div class="content_line_videoEdit">编辑</div>
					<div class="content_line_delete">✖</div>
				</div>
			`);

		contentLine[bindMeasuringBlockAttr] = measuringBlock;

		// 音量
		{
			const defaultVolume = Config.defaultVolume;
			const numberEditor = NumberEditor.create(defaultVolume);
			MeasuringBlock.setVideoVolume(measuringBlock, defaultVolume / 100);
			NumberEditor.editing(numberEditor, ({currentNumber}) => {
				MeasuringBlock.setVideoVolume(measuringBlock, currentNumber / 100);
			});
			contentLine.querySelector('.content_line_volume').appendChild(numberEditor);
		}

		// 选择视频文件
		{
			const videoInput = contentLine.querySelector('.content_line_videoInput');
			videoInput.dataset.videoUrl = 'null';
			videoInput.addEventListener('click', () => {
				userSelectFile('.mp4, .mkv, .flv')
					.then(file => {
						URL.revokeObjectURL(videoInput.dataset.videoUrl);
						const videoFileUrl = URL.createObjectURL(file);
						videoInput.dataset.videoUrl = videoFileUrl;
						contentLine.querySelector('.content_line_videoEdit').classList.add('editable');
						videoInput.textContent = file.name;

						contentLine?.[videoInputCallbackAttr]?.({videoFileUrl, file});
					});
			});
		}

		// 描述按钮
		{

			const lineNameNode = contentLine.querySelector('.content_line_name');
			lineNameNode.addEventListener('click', () => {
				const input = createNode(`<input class="user_input" type="text" autocomplete="off" />`);
				input.value = lineNameNode.textContent;
				lineNameNode.appendChild(input);
				input.focus();
				input.addEventListener('blur', () => {
					if (input.value.trim().length > 0) {
						this.setName(contentLine, input.value);
					}
					input.remove();
				});
			});
		}

		// 编辑按钮
		{
			const videoEdit = contentLine.querySelector('.content_line_videoEdit');
			videoEdit.addEventListener('click', () => {
				if (videoEdit.classList.contains('editable')) {
					contentLine?.[videoEditCallbackAttr]?.();
				}
			});
		}

		// 删除按钮
		{
			const videoDelete = contentLine.querySelector('.content_line_delete');
			videoDelete.addEventListener('click', () => {
				contentLine?.[videoDeleteCallbackAttr]?.();
			});
		}

		return contentLine
	},

	/**
	 * 获取描述
	 * @param contentLine
	 * @return {string}
	 */
	getName(contentLine) {
		return contentLine.querySelector('.content_line_name').textContent
	},

	/**
	 *
	 * @param contentLine
	 * @param {string} name
	 */
	setName(contentLine, name) {
		const lineNameNode = contentLine.querySelector('.content_line_name');
		lineNameNode.textContent = name;
	},

	/**
	 * 获取视频文件url
	 * @param contentLine
	 * @return {?string}
	 */
	getVideoUrl(contentLine) {
		const url = contentLine.querySelector('.content_line_videoInput')?.dataset?.videoUrl;
		if (url?.length > 4) {
			return url
		}
		return null
	},

	/**
	 *
	 * @param contentLine
	 * @param {videoInputCallback} cb
	 */
	setVideoInputCallback(contentLine, cb) {
		contentLine[videoInputCallbackAttr] = cb;
	},

	/**
	 *
	 * @param contentLine
	 * @param {function} cb
	 */
	setVideoEditCallback(contentLine, cb) {
		contentLine[videoEditCallbackAttr] = cb;
	},

	/**
	 *
	 * @param contentLine
	 * @param {function} cb
	 */
	setVideoDeleteCallback(contentLine, cb) {
		contentLine[videoDeleteCallbackAttr] = cb;
	},

	remove(contentLine) {
		MeasuringBlock.remove(contentLine[bindMeasuringBlockAttr]);
		contentLine.remove();
	},

};


export default ListContentLine;