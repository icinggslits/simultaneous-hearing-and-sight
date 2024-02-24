import {clog, Convert, createNode, mouseDrag} from './unit.js';
import Config from './config.js';
import externalVideoHub from './externalVideoHub.js';
import ListContentLine from './ListContentLine.js';




const videoAttr = Symbol();
const targetNodeAttr = Symbol();
const importedCreateAttr = Symbol('Marked as imported to create');

/**
 *
 * @type {Map<any, {width: number, parentWidth: number}>}
 */
const measuringBlockMappingResize = new Map();

/**
 *
 * @type {Map<any, {left: number, top: number, parentWidth: number, parentHeight: number}>}
 */
const measuringBlockMappingPosition = new Map();

// 更新视频比例(从外部导入视频时，视频尺寸数据注入得晚)
const updateVideoRatios = (measuringBlock) => {
	const video = measuringBlock.querySelector('video');
	measuringBlock.dataset.videoWidth = video.videoWidth;
	measuringBlock.dataset.videoHeight = video.videoHeight;
};

const MeasuringBlock = {
	/**
	 * 是否是MeasuringBlock对象
	 * @param measuringBlock
	 * @return {boolean}
	 */
	is(measuringBlock) {
		return !!measuringBlock?.classList?.contains('.__sign_SHAS_measuringBlock')
	},

	/**
	 *
	 * @param targetNode - 插入到targetNode
	 */
	create(targetNode) {
		const measuringBlock = createNode(`
			<div class="__sign_SHAS_measuringBlock">
				<video></video>
				<div class="__sign_SHAS_measuringBlock_resize"></div>
			</div>
		`);

		measuringBlock.style.width = '300px';
		measuringBlock.style.height = '200px';
		measuringBlock.style.top = '0';
		measuringBlock.style.left = '0';

		const video = measuringBlock.querySelector('video');
		measuringBlock[videoAttr] = video;
		measuringBlock[targetNodeAttr] = targetNode;
		video.addEventListener('loadedmetadata', () => {
			MeasuringBlock.setVideoRatios(measuringBlock, video.videoWidth, video.videoHeight);
			if (measuringBlock[importedCreateAttr] !== true) {
				// 初始化位置为(0, 0)
				MeasuringBlock.setPositionByRatio(measuringBlock, [0, 1], [0, 1]);
			}

		});

		video.addEventListener('ended', () => {
			MeasuringBlock.hide(measuringBlock);
		});

		const resizeBlock = measuringBlock.querySelector('.__sign_SHAS_measuringBlock_resize');

		// 调整尺寸
		mouseDrag(resizeBlock, ({diff_x, diff_y, onceData: {width, height}}) => {
			const {left: measuringBlockLeft, top: measuringBlockTop} = measuringBlock.getBoundingClientRect();
			const {
				right: targetNodeRight,
				bottom: targetNodeBottom,
				width: targetNodeWidth,
				height: targetNodeHeight,
			} = targetNode.getBoundingClientRect();

			const maxResizeWidth = targetNodeRight - measuringBlockLeft;
			const maxResizeHeight = targetNodeBottom - measuringBlockTop;

			// const resizeWidth = Convert.upperLimit(
			// 	Convert.lowerLimit(width + diff_x, Config.measuringBlockResizeSize),
			// 	maxResizeWidth,
			// );

			const resizeWidth = Convert.limits(
		width + diff_x,
				Config.measuringBlockResizeSize,
				maxResizeWidth,
			);



			if (Convert.isNumber(measuringBlock.dataset.videoWidth)) {
				// 如果设置了对应的视频尺寸，那么固定缩放比例
				const aspectRatio = Convert.toNumber(measuringBlock.dataset.videoHeight) / Convert.toNumber(measuringBlock.dataset.videoWidth);

				// const resizeHeight = Convert.upperLimit(
				// 	Convert.lowerLimit(height + diff_x * aspectRatio, Config.measuringBlockResizeSize),
				// 	maxResizeHeight,
				// );

				const resizeHeight = Convert.limits(
					height + diff_x * aspectRatio,
					Config.measuringBlockResizeSize,
					maxResizeHeight,
				);



				// 宽高都不超过边界时才允许缩放
				if (resizeHeight !== maxResizeHeight && resizeWidth !== maxResizeWidth) {
					this.setVideoRatioWidthAndKeepAspectRatio(measuringBlock, [resizeWidth, targetNodeWidth]);



					// measuringBlock.style.width = `${(resizeWidth / targetNodeWidth) * 100}%`;
					// measuringBlock.style.height = `${(resizeHeight / targetNodeHeight) * 100}%`;
				}

			} else {
				// 不限制缩放比例 - 正常使用时此处不可达
				const resizeHeight = Convert.upperLimit(
					Convert.lowerLimit(height + diff_y, Config.measuringBlockResizeSize),
					maxResizeHeight,
				);

				measuringBlock.style.width = `${(resizeWidth / targetNodeWidth) * 100}%`;
				measuringBlock.style.height = `${(resizeHeight / targetNodeHeight) * 100}%`;
			}


		}, () => {
			const {width, height} = measuringBlock.getBoundingClientRect();
			return {
				width,
				height,
			}
		});

		// 调整位置
		mouseDrag(measuringBlock, ({diff_x, diff_y, onceData: {top: originalTop, left: originalLeft, width: originalWidth, height: originalHeight}}) => {
			const {width: measuringBlockWidth, height: measuringBlockHeight} = measuringBlock.getBoundingClientRect();
			const {
				width: targetNodeWidth,
				height: targetNodeHeight,
				left: targetNodeLeft,
				right: targetNodeRight,
				top: targetNodeTop,
				bottom: targetNodeBottom,
			} = targetNode.getBoundingClientRect();


			const leftOfPx = originalLeft + diff_x;
			const topOfPx = originalTop + diff_y;


			const left = Convert.limits(leftOfPx - targetNodeLeft, 0, targetNodeWidth - originalWidth);
			const top = Convert.limits(topOfPx - targetNodeTop, 0, targetNodeHeight - originalHeight);

			// const left = Convert.limits(
			// 	(leftOfPx - targetNodeLeft) / targetNodeWidth,
			// 	0.0,
			// 	1.0 - measuringBlockWidth / targetNodeWidth,
			// );
			// const top = Convert.limits(
			// 	(topOfPx - targetNodeTop) / targetNodeHeight,
			// 	0.0,
			// 	1.0 - measuringBlockHeight / targetNodeHeight,
			// );

			this.setPositionByRatio(measuringBlock, [left, targetNodeWidth], [top, targetNodeHeight]);

			// const left = left_2 / targetNodeWidth;
			// const top = top_2 / targetNodeHeight;
			//
			// measuringBlock.style.left = `${left * 100}%`;
			// measuringBlock.style.top = `${top * 100}%`;

		}, () => {
			const {top, left, width, height} = measuringBlock.getBoundingClientRect();
			return {
				top,
				left,
				width,
				height,
			}
		});

		targetNode.appendChild(measuringBlock);

		return measuringBlock
	},

	/**
	 *
	 * @param measuringBlock
	 * @param {[number, number]} ratio
	 */
	setVideoRatioWidthAndKeepAspectRatio(measuringBlock, ratio) {
		const videoWidth = Convert.toNumber(measuringBlock.dataset.videoWidth);
		const videoHeight = Convert.toNumber(measuringBlock.dataset.videoHeight);
		const [width, parentWidth] = ratio;
		const aspectRatio = videoHeight / videoWidth;
		const {height: parentHeight} = measuringBlock[targetNodeAttr].getBoundingClientRect();
		measuringBlock.style.width = `${(width / parentWidth) * 100}%`;
		measuringBlock.style.height = `${((width * aspectRatio) / parentHeight) * 100}%`;
		// clog(width, aspectRatio, parentHeight)

		measuringBlockMappingResize.set(measuringBlock, {width, parentWidth});
		// if (Convert.isNumber(measuringBlock.dataset.videoWidth)) {
		//
		// } else {
		// 	throw new Error('必须通过setVideoRatios()设置过比例');
		// }
	},

	/**
	 *
	 * @param measuringBlock
	 * @param {[number, number]} ratioX
	 * @param {[number, number]} ratioY
	 */
	setPositionByRatio(measuringBlock, ratioX, ratioY) {
		const [leftOfPx, targetNodeWidth] = ratioX;
		const [topOfPx, targetNodeHeight] = ratioY;
		const left = leftOfPx / targetNodeWidth;
		const top = topOfPx / targetNodeHeight;
		measuringBlock.style.left = `${left * 100}%`;
		measuringBlock.style.top = `${top * 100}%`;

		measuringBlockMappingPosition.set(measuringBlock, {
			left: leftOfPx,
			top: topOfPx,
			parentWidth: targetNodeWidth,
			parentHeight: targetNodeHeight,
		})
	},

	/**
	 * 设置对应的视频尺寸比例
	 * @param measuringBlock
	 * @param {number} width
	 * @param {number} height
	 */
	setVideoRatios(measuringBlock, width, height) {
		measuringBlock.dataset.videoWidth = width.toString();
		measuringBlock.dataset.videoHeight = height.toString();
		const {width: parentWidth} = measuringBlock[targetNodeAttr].getBoundingClientRect();
		const {width: measuringBlockWidth} = measuringBlock.getBoundingClientRect();
		this.setVideoRatioWidthAndKeepAspectRatio(measuringBlock, [measuringBlockWidth, parentWidth])
	},

	show(measuringBlock) {
		measuringBlock?.classList?.add('show');
	},

	alwaysShow(measuringBlock) {
		measuringBlock?.classList?.add('alwaysShow');
	},

	closeAlwaysShow(measuringBlock) {
		measuringBlock?.classList?.remove('alwaysShow');
	},

	editMode(measuringBlock) {
		measuringBlock?.classList?.add('edit');
	},

	exitEditMode(measuringBlock) {
		measuringBlock?.classList?.remove('edit');
	},

	allExitEditMode () {
		for (const measuringBlock of document.querySelectorAll('.__sign_SHAS_measuringBlock.edit')) {
			this.exitEditMode(measuringBlock);
			this.closeAlwaysShow(measuringBlock);
		}
	},

	hide(measuringBlock) {
		if (measuringBlock?.classList?.contains('alwaysShow') === false) {
			measuringBlock?.classList?.remove('show');
			measuringBlock?.classList?.remove('alwaysShow');
		}
	},

	hideAll() {
		for (const measuringBlock of document.querySelectorAll('.__sign_SHAS_measuringBlock')) {
			this.hide(measuringBlock);
		}
	},

	/**
	 *
	 * @param measuringBlock
	 * @param {string} videoFileUrl
	 */
	importVideo(measuringBlock, videoFileUrl) {
		const video = measuringBlock[videoAttr];
		video.src = videoFileUrl;

		updateVideoRatios(measuringBlock);
	},

	/**
	 *
	 * @param measuringBlock
	 * @return {{currentTime: number, duration: number}}
	 */
	getVideoInfo(measuringBlock) {
		const {currentTime, duration} = measuringBlock[videoAttr];

		return {
			currentTime,
			duration,
		}
	},

	videoPlay(measuringBlock) {
		measuringBlock[videoAttr].play().then();
	},

	videoPause(measuringBlock) {
		measuringBlock[videoAttr].pause();
	},

	videoSetCurrentTime(measuringBlock, currentTime) {
		measuringBlock[videoAttr].currentTime = currentTime;
	},

	videoAllPause() {
		for (const measuringBlock of document.querySelectorAll('.__sign_SHAS_measuringBlock')) {
			this.videoPause(measuringBlock);
		}
	},

	/**
	 *
	 * @param measuringBlock
	 * @param {number} volume
	 */
	setVideoVolume(measuringBlock, volume) {
		measuringBlock[videoAttr].volume = volume;
	},

	/**
	 *
	 * @param measuringBlock
	 * @param {number} playbackRate
	 */
	setVideoPlaybackRate(measuringBlock, playbackRate) {
		measuringBlock[videoAttr].playbackRate = playbackRate;
	},

	/**
	 *
	 * @param {number} playbackRate
	 */
	setAllVideoPlaybackRate(playbackRate) {
		externalVideoHub.allMeasuringBlock().forEach(measuringBlock => this.setVideoPlaybackRate(measuringBlock, playbackRate));
	},

	remove(measuringBlock) {
		measuringBlockMappingResize.delete(measuringBlock);
		measuringBlockMappingPosition.delete(measuringBlock);
		measuringBlock.remove();
	},

	/**
	 *
	 * @param measuringBlock
	 * @return {string}
	 */
	serialize(measuringBlock) {
		const {width, parentWidth: parentWidthOfResize} = measuringBlockMappingResize.get(measuringBlock);
		const {left, top, parentWidth: parentWidthOfPosition, parentHeight} = measuringBlockMappingPosition.get(measuringBlock);
		return `${width},${parentWidthOfResize};${left},${parentWidthOfPosition},${top},${parentHeight}`
	},

	markAsImportedCreate(measuringBlock) {
		measuringBlock[importedCreateAttr] = true;
	},
};

























export default MeasuringBlock;