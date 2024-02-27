import {clog, createNode, debugCapture, findInsertIndex, triggerBuilder} from './unit.js';
import externalVideoHub from './externalVideoHub.js';
import MeasuringBlock from './MeasuringBlock.js';
import measuringBlock from './MeasuringBlock.js';
import Panel from './panel.js';

/*
 *  b站视频事件相关
 */

/**
 * 触发来源
 */
const triggerSource = {
	PLAY: Symbol('play'),
	PAUSE: Symbol('pause'),
	SEEKING: Symbol('seeking'),
	TRIGGER: Symbol('trigger'),
};


/**
 * 视频比例
 * @return {{videoWidth: number, videoHeight: number}}
 */
const videoProportions = () => {
	const bilibiliPlayerVideo = document.querySelector('.bpx-player-video-area video');
	if (bilibiliPlayerVideo) {
		return {
			videoWidth: bilibiliPlayerVideo.videoWidth,
			videoHeight: bilibiliPlayerVideo.videoHeight,
		}
	} else {
		// 测试用，实际环境不会抵达这里
		return {
			videoWidth: 1920,
			videoHeight: 1080,
		}
	}
};



const {area, videoArea} = (() => {
	const area = document.querySelector('.bpx-player-video-area');
	const videoArea = createNode(`<div class="__sign_SHAS_videoArea"></div>`);
	area.appendChild(videoArea);
	const {width, height} = area.getBoundingClientRect();
	area.dataset.lastWidth = width.toString();
	area.dataset.lastHeight = height.toString();

	return {area, videoArea}
})();


const updateArea = () => {
	const {width: areaWidth, height: areaHeight} = area.getBoundingClientRect();
	const {videoWidth, videoHeight} = videoProportions();
	const {width, height} = area.getBoundingClientRect();

	if (videoHeight * (areaWidth / areaHeight) >= videoWidth) {
		// 视频高等于父级DOM高
		const videoAreaWidth = areaHeight * (videoWidth / videoHeight);
		videoArea.style.left = `${(areaWidth - videoAreaWidth) / 2}px`;
		videoArea.style.top = `0`;
		videoArea.style.width = `${videoAreaWidth}px`;
		videoArea.style.height = '100%';
	} else {
		// 视频宽等于父级DOM宽
		const videoAreaHeight = areaWidth * (videoHeight / videoWidth);
		videoArea.style.top = `${(areaHeight - videoAreaHeight) / 2}px`;
		videoArea.style.left = `0`;
		videoArea.style.width = '100%';
		videoArea.style.height = `${videoAreaHeight}px`;
	}

	area.dataset.lastWidth = width.toString();
	area.dataset.lastHeight = height.toString();
};


// 视频区域大小变动自更新数据
{
	const ob = new ResizeObserver(() => {
		updateArea();
	});
	ob.observe(area);
}


const bilibiliPlayerVideo = document.querySelector('.bpx-player-video-area video');
const syncVideo = (source) => {
	/** @type {number} */
	const currentTime = bilibiliPlayerVideo.currentTime;



	// const videoRange = externalVideoHub.allVideoRange();
	// MeasuringBlock.videoAllPause();
	// MeasuringBlock.hideAll();
	// for (const {startTime, endTime, measuringBlock} of videoRange) {
	// 	if (currentTime >= startTime && currentTime < endTime) {
	// 		MeasuringBlock.show(measuringBlock);
	// 		MeasuringBlock.videoSetCurrentTime(measuringBlock, currentTime - startTime);
	// 		MeasuringBlock.videoPlay(measuringBlock);
	// 		break;
	// 	}
	// }


	/**
	 * 需要播放的列表
	 * @type {{measuringBlock, currentTime: number}[]}
	 */
	const awaitingPlaybackList = [];

	// MeasuringBlock.videoAllPause();
	const videoRange = externalVideoHub.allVideoRange();
	for (const {targetMeasuringBlock, keyframeList} of videoRange) {

		/** @type {?number} */
		let latestStartTime = null;
		let targetOriginalTime = 0;
		let targetExternalVideoTime = 0;

		const maxEndTime = (() => {
			let max = Number.MIN_VALUE;
			keyframeList.forEach(({endTime}) => endTime > max ? max = endTime : null);
			return max
		})();

		for (const keyframe of keyframeList) {
			const {startTime, endTime, originalTime, externalVideoTime} = keyframe;
			if (currentTime >= originalTime && currentTime < maxEndTime) {
				if (latestStartTime === null) {
					latestStartTime = originalTime;
					targetOriginalTime = originalTime;
					targetExternalVideoTime = externalVideoTime;
				} else {
					if (latestStartTime < originalTime) {
						latestStartTime = originalTime;
						targetOriginalTime = originalTime;
						targetExternalVideoTime = externalVideoTime;
					}
				}
			}
		}

		if (latestStartTime !== null) {
			awaitingPlaybackList.push({
				measuringBlock: targetMeasuringBlock,
				currentTime: targetExternalVideoTime + currentTime - targetOriginalTime,
			});
		}
	}

	that:
	for (const oneOfMeasuringBlock of externalVideoHub.allMeasuringBlock()) {
		for (const {measuringBlock, currentTime} of awaitingPlaybackList) {
			if (oneOfMeasuringBlock === measuringBlock) {
				MeasuringBlock.show(measuringBlock)
				MeasuringBlock.videoSetCurrentTime(measuringBlock, currentTime);

				switch (source) {
					case triggerSource.PAUSE: {
						MeasuringBlock.videoPause(measuringBlock);
					}
					break;

					case triggerSource.PLAY: {
						MeasuringBlock.videoPlay(measuringBlock);
					}
					break;

					case triggerSource.SEEKING: {
						MeasuringBlock.videoPause(measuringBlock);
						bilibiliPlayerVideo.addEventListener('canplay', () => {
							MeasuringBlock.videoPlay(measuringBlock)
						}, {once: true});
					}
					break;
					case triggerSource.TRIGGER: {
						MeasuringBlock.videoPlay(measuringBlock);
					}
					break;
				}

				continue that;
			}
		}
		MeasuringBlock.videoPause(oneOfMeasuringBlock);
		MeasuringBlock.hide(oneOfMeasuringBlock);
	}


};


/** @type {number[]} */
let keyframeList = [];
let nextKeyframeIndex = 0;

/**
 *
 * @type {function[]}
 */
const triggerCallback = [];

const trigger = triggerBuilder(() => {
	/** @type {number} */
	const currentTime = bilibiliPlayerVideo.currentTime;


	const nextKeyframe = keyframeList[nextKeyframeIndex];
	if (currentTime >= nextKeyframe) {
		syncVideo(triggerSource.TRIGGER);
		nextKeyframeIndex++;
	}

	triggerCallback.forEach(cb => cb());
});

/**
 *
 * @param {function} callback
 */
const videoTrigger = (callback) => {
	triggerCallback.push(callback);
};

const resetTriggerPointer  = () => {
	const referencePointList = externalVideoHub.allReferencePoint();

	const currentTime = bilibiliPlayerVideo.currentTime;

	{
		keyframeList = [];
		for (const {originalTime, measuringBlock, externalVideoTime} of referencePointList) {
			// const endTime = startTime + MeasuringBlock.getVideoInfo(measuringBlock).duration;
			keyframeList.push(originalTime);
		}

		nextKeyframeIndex = findInsertIndex(keyframeList, currentTime);

	}


};

bilibiliPlayerVideo.addEventListener('play', () => {
	// clog('play')
	resetTriggerPointer();
	syncVideo(triggerSource.PLAY);
	trigger.start();

});

bilibiliPlayerVideo.addEventListener('pause', () => {
	// clog('pause')
	resetTriggerPointer();
	syncVideo(triggerSource.PAUSE);
	trigger.stop();
});

bilibiliPlayerVideo.addEventListener('seeking', () => {
	// clog('seeking')
	resetTriggerPointer();
	syncVideo(triggerSource.SEEKING);
});

bilibiliPlayerVideo.addEventListener('ratechange', (event) => {
	MeasuringBlock.setAllVideoPlaybackRate(bilibiliPlayerVideo.playbackRate);
});


let lastVideoPaused = false;
let isBan = false;

const bilibiliPlayerVideoController = {
	// 暂停b站视频并禁用交互
	pauseAndBan() {
		isBan = true;
		lastVideoPaused = bilibiliPlayerVideo.paused;
		bilibiliPlayerVideo.pause();
		bilibiliPlayerVideo.classList.add('ban');
	},

	// 解除禁用
	relieve() {
		if (isBan) {
			isBan = false;
			bilibiliPlayerVideo.classList.remove('ban');
			if (lastVideoPaused) {
				bilibiliPlayerVideo.pause();
			} else {
				bilibiliPlayerVideo.play().then();
			}
		}
	},

	syncVideo() {
		resetTriggerPointer();
		syncVideo();
	},

	/**
	 *
	 * @param {function} callback
	 */
	videoTrigger(callback) {
		videoTrigger(callback);
	},
};

export {bilibiliPlayerVideo, bilibiliPlayerVideoController, updateArea};