import {clog, Convert, debugCapture} from './unit.js'
import Panel from './panel.js';
import ListContentLine from './ListContentLine.js';
import MeasuringBlock from './MeasuringBlock.js';
import {bilibiliPlayerVideo} from './bilibiliPlayerVideoEvent.js';

/**
 * 基准点
 * @typedef referencePoint
 * @type {object}
 * @property {number} originalTime
 * @property {number} externalVideoTime
 */

/**
 * 视频挂载配置数据v1
 * @typedef externalVideo1
 * @type {object}
 * @property {string} versions - 版本号
 * @property {referencePoint[]} referencePointList - 基准点列表
 */

const regularExpression = {
	// 原本打算使用方括号，但是b站评论会自动把半角方括号变全角方括号（[] -> 【】），所以换成了半角花括号

	// // 匹配主体的正则
	// patternMain: /(\[1v(.*?)])|(\{1v(.*?)})/g,
	//
	// // 匹配描述的正则
	// patternDescription: /(\[(.*?)]$)|(\{(.*?)}$)/,
	//
	// // 匹配包含可能存在的描述的正则
	// patternCompletely: /((\[(.*?)])?\[1v(.*?)])|((\{(.*?)})?\[1v(.*?)})/g,



	// 匹配主体的正则
	patternMain: /\{1v(.*?)}/g,

	// 匹配描述的正则
	patternDescription: /\{(.*?)}$/,

	// 匹配包含可能存在的描述的正则
	patternCompletely: /(\{(.*?)})?\{1v(.*?)}/g,


};

/**
 * 搜索文本中存在的反序列字符串
 * @param {string} text
 * @return {{description: ?string, deserializingData: string}[]}
 */
const searchDeserializingData = (text) => {
	const list = [];

	// 匹配主体的正则
	const patternMain = regularExpression.patternMain;

	// 匹配描述的正则
	const patternDescription = regularExpression.patternDescription;

	let lastSliceIndex = 0;

	for (const regExpMatchArray of text.matchAll(patternMain)) {
		// clog(regExpMatchArray)
		const frontText = regExpMatchArray.input.slice(lastSliceIndex, regExpMatchArray.index);
		const deserializingData = regExpMatchArray[1];
		lastSliceIndex = regExpMatchArray.index + regExpMatchArray[0].length;

		let description = null;
		const descriptionMatch = frontText.match(patternDescription);
		if (descriptionMatch) {
			description = descriptionMatch[1];
		}

		list.push({
			description,
			deserializingData,
		});
	}

	return list
};


/**
 *
 * @type {Map<any, externalVideo1>}
 */
const contentLineMappingConfig = new Map();

const contentLineMappingMeasuringBlock = new Map();

/**
 *
 * @type {{originalTime: number, externalVideoTime:number, measuringBlock}[]}
 */
let referencePointOfCache = [];

/**
 *
 * @type {Map<any, File>}
 */
const contentLineMappingFile = new Map();

/**
 *
 * @param contentLine
 * @return {string}
 */
const serializeV1 = (contentLine) => {
	const {referencePointList} = contentLineMappingConfig.get(contentLine);
	const measuringBlock = contentLineMappingMeasuringBlock.get(contentLine);
	const list = [];
	for (const {originalTime, externalVideoTime} of referencePointList) {
		list.push(`${originalTime}>${externalVideoTime}`);
	}

	const listString = (() => {
		if (list.length === 0) {
			return 'null'
		} else {
			return list.join(',')
		}
	})();

	return `{${ListContentLine.getName(contentLine)}}{1v${MeasuringBlock.serialize(measuringBlock)};${listString}}`
};


/**
 *
 * @param referencePointLine
 * @return {?[referencePoint, number]}
 */
const targetReferencePoint = (referencePointLine) => {
	const {panelNode: panel, editingContentLine} = Panel;
	const referencePointLineList = panel.querySelectorAll('.__sign_SHAS_referencePointLine');
	for (let i = 0; i < referencePointLineList.length; i++) {
		const referencePointLineElement = referencePointLineList[i];
		if (referencePointLineElement === referencePointLine) {
			const externalVideo1 = contentLineMappingConfig.get(editingContentLine);
			if (externalVideo1) {
				const {versions, referencePointList} = externalVideo1;
				return [referencePointList[i], i]
			}
			return null
		}
	}
	return null
};

const updateReferencePointOfCache = () => {
	referencePointOfCache = [];
	const panel = Panel.panelNode;
	const contentLineList = panel.querySelectorAll('.content_line');
	let i = 0;
	for (const {versions, referencePointList} of contentLineMappingConfig.values()) {
		for (const {originalTime, externalVideoTime} of referencePointList) {
			referencePointOfCache.push({
				originalTime,
				externalVideoTime,
				measuringBlock: contentLineMappingMeasuringBlock.get(contentLineList[i]),
			});
		}
		i++;
	}
	referencePointOfCache.sort(({originalTime: a}, {originalTime: b}) => a - b);
};

const externalVideoHub = {
	addByContentLine(contentLine, measuringBlock) {
		contentLineMappingConfig.set(contentLine, {
			versions: '1',
			referencePointList: [],
		});

		contentLineMappingMeasuringBlock.set(contentLine, measuringBlock);
		updateReferencePointOfCache();
	},

	/**
	 *
	 * @param contentLine
	 * @return {?any}
	 */
	getMeasuringBlock(contentLine) {
		return contentLineMappingMeasuringBlock.get(contentLine)
	},

	/**
	 *
	 * @param contentLine
	 * @param {referencePoint} referencePoint
	 * @return {boolean}
	 */
	addReferencePoint(contentLine, referencePoint) {
		const referencePointList = contentLineMappingConfig.get(contentLine);
		if (referencePointList) {
			referencePointList.referencePointList.push(referencePoint);
			updateReferencePointOfCache();
			return true
		}
		return false
	},

	/**
	 *
	 * @param contentLine
	 * @return {externalVideo1}
	 */
	getReferencePointAll(contentLine) {
		return contentLineMappingConfig.get(contentLine)
	},

	setOriginalTimeOfReferencePoint(referencePointLine, seconds) {
		const ok = targetReferencePoint(referencePointLine);
		if (ok) {
			const [referencePoint] = ok;
			referencePoint.originalTime = seconds;
			updateReferencePointOfCache();
		}
	},

	setExternalVideoTimeBySeconds(referencePointLine, seconds) {
		const ok = targetReferencePoint(referencePointLine);
		if (ok) {
			const [referencePoint] = ok;
			referencePoint.externalVideoTime = seconds;
			updateReferencePointOfCache();
		}
	},

	deleteReferencePoint(referencePointLine) {
		const ok = targetReferencePoint(referencePointLine);
		if (ok) {
			const [referencePoint, i] = ok;
			const {versions, referencePointList} = contentLineMappingConfig.get(Panel.editingContentLine);
			referencePointList.splice(i, 1);
		}
	},

	/**
	 *
	 * @param contentLine
	 * @param {File} file
	 */
	setFile(contentLine, file) {
		contentLineMappingFile.set(contentLine, file);
	},

	/**
	 *
	 * @param contentLine
	 * @return {?File}
	 */
	getFile(contentLine) {
		return contentLineMappingFile.get(contentLine)
	},

	/**
	 * 返回全部的referencePoint数组，根据originalTime按从小到大排序
	 * @return {{originalTime: number, externalVideoTime: number, measuringBlock}[]}
	 */
	allReferencePoint() {
		return referencePointOfCache
	},

	/**
	 *
	 * @return {any[]}
	 */
	allMeasuringBlock() {
		return [...contentLineMappingMeasuringBlock.values()]
	},

	/**
	 *
	 * @return {any[]}
	 */
	allContentLine() {
		return [...contentLineMappingMeasuringBlock.keys()]
	},

	/**
	 *
	 * @return {{targetMeasuringBlock, keyframeList: {startTime: number, endTime: number, originalTime: number, externalVideoTime: number}[]}[]}
	 */
	allVideoRange() {
		const videoRange = [];
		for (const [contentLine, measuringBlock] of contentLineMappingMeasuringBlock) {

			const {versions, referencePointList} = contentLineMappingConfig.get(contentLine);
			const measuringBlock = contentLineMappingMeasuringBlock.get(contentLine);
			const {currentTime, duration} = MeasuringBlock.getVideoInfo(measuringBlock);

			const keyframeList = [];

			// 有基准点的外挂视频才会被外挂
			if (referencePointList.length > 0) {

				// 得到指向外挂视频的最小的时间戳
				// let {
				// 	externalVideoTime: minExternalVideoTime,
				// 	originalTime: targetOriginalTime,
				// } = referencePointList[0];
				// for (let i = 1; i < referencePointList.length; i++) {
				// 	const {externalVideoTime, originalTime} = referencePointList[i];
				// 	if (externalVideoTime < minExternalVideoTime) {
				// 		minExternalVideoTime = externalVideoTime;
				// 		targetOriginalTime = originalTime;
				// 	}
				// }

				for (const {externalVideoTime, originalTime} of referencePointList) {
					const startTime = originalTime - externalVideoTime;
					const endTime = startTime + duration;

					keyframeList.push({
						startTime,
						endTime,
						originalTime,
						externalVideoTime,
					});
				}
			}


			videoRange.push({
				targetMeasuringBlock: measuringBlock,
				keyframeList,
			})
		}
		videoRange.sort(({startTime: a}, {startTime: b}) => a - b);
		return videoRange
	},

	deleteContentLine(contentLine) {
		contentLineMappingConfig.delete(contentLine);
		contentLineMappingMeasuringBlock.delete(contentLine);
		contentLineMappingFile.delete(contentLine);
	},

	/**
	 *
	 * @param contentLine
	 * @return {?string}
	 */
	serialize(contentLine) {
		const {versions, referencePointList} = contentLineMappingConfig.get(contentLine);
		const measuringBlock = contentLineMappingMeasuringBlock.get(contentLine);

		return (() => {
			switch (versions) {
				case '1': {
					return serializeV1(contentLine);
				}
			}
			return null
		})();
	},

	deserializeTo(contentLine) {

	}
};





















export default externalVideoHub;
export {regularExpression, searchDeserializingData};