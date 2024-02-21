import {barDrag, clog, Convert, createNode, parseTime} from './unit.js';
import ListContentLine from './ListContentLine.js';
import MeasuringBlock from './MeasuringBlock.js';
import ReferencePointLine from './ReferencePointLine.js';
import externalVideoHub, {searchDeserializingData} from './externalVideoHub.js';
import {bilibiliPlayerVideo, bilibiliPlayerVideoController} from './bilibiliPlayerVideoEvent.js';


const panelConfig = {
	width: 500,
	height: 400,
};

// 当前是否打开
let isOpen = false;

// 第一次打开
let firstOpen = true;

const panel = createNode(`
		<div class="__sign_SHAS_panel">
		  <div class="top">
		    <div class="left">
			  <div class="back">
                <div class="back_line_1"></div>
                <div class="back_line_2"></div>
              </div>
			</div>
		  	<div class="right">
		      <div class="close_line_1"></div>
		      <div class="close_line_2"></div>
            </div>
		  </div>
		  <div class="main">
		  	<div class="listPage page">
		  		<div class="content">
				  <div class="content_column_line">
				    <div class="content_column_name">描述</div>
				    <div class="content_column_videoInput">视频源</div>
				    <div class="content_column_volume">音量</div>
				    <div class="content_column_edit">轴对轴</div>
				    <div class="content_column_delete"></div>
				  </div>
		  		  
				</div>
				<div class="create_new_line">
				  <span class="create_new_line_button">✚</span>
				</div>
			</div>
			<div class="editPage page hide">
			  <div class="editPage_title"></div>
			  <div class="editPage_column">
			  	<div class="editPage_column_descriptions">网站视频</div>
			  	<div class="editPage_column_descriptions">挂载视频</div>
			  	<div class="editPage_column_occupy"></div>
			  </div>
			  <div class="content"></div>
			  <div class="editPage_tool">
			    <div class="editPage_newPoint">✚</div>
			    <div class="editPage_export">复制配置</div>
			  </div>
			  <div class="editPage_bottom">
			  	<div class="editPage_bottom_externalVideoTime"></div>
			  </div>
			</div>
		  </div>
		</div>
	`);

const panelMain = panel.querySelector('.main');

let editingContentLine;





const createLine = () => {
	const measuringBlock = MeasuringBlock.create(document.querySelector('.__sign_SHAS_videoArea'));
	const contentLine = ListContentLine.create(measuringBlock);
	ListContentLine.setVideoEditCallback(contentLine, () => {
		panelPage.toEdit(contentLine);
	});

	ListContentLine.setVideoInputCallback(contentLine, ({videoFileUrl, file}) => {
		MeasuringBlock.importVideo(measuringBlock, videoFileUrl);
		externalVideoHub.setFile(contentLine, file);
	});

	ListContentLine.setVideoDeleteCallback(contentLine, () => {
		externalVideoHub.deleteContentLine(contentLine);
		ListContentLine.remove(contentLine);
	});

	externalVideoHub.addByContentLine(contentLine, measuringBlock);

	const content = panel.querySelector('.listPage .content');
	content.appendChild(contentLine);
	return contentLine
};

/**
 * 导入配置字符串创建挂载视频
 * @param {string} deserializingData
 * @param {?string} description
 */
const createLineByDeserialize = (deserializingData, description = null) => {
	const contentLine = createLine();

	const measuringBlock = externalVideoHub.getMeasuringBlock(contentLine);
	const {
		width,
		parentWidthOfResize,

		left,
		parentWidthOfPosition,
		top,
		parentHeight,

		referencePointList
	} = deserializeV1(deserializingData);

	MeasuringBlock.markAsImportedCreate(measuringBlock);
	MeasuringBlock.setVideoRatioWidthAndKeepAspectRatio(measuringBlock, [width, parentWidthOfResize]);
	MeasuringBlock.setPositionByRatio(measuringBlock, [left, parentWidthOfPosition], [top, parentHeight]);
	referencePointList.forEach(referencePoint => externalVideoHub.addReferencePoint(contentLine, referencePoint));

	if (description) {
		ListContentLine.setName(contentLine, description);
	}
};

/**
 *
 * @param {string} deserializingData
 * @return {{width: number, parentWidthOfResize:number, left:number, parentWidthOfPosition:number, top:number, parentHeight:number, referencePointList: referencePoint[]}}
 */
const deserializeV1 = (deserializingData) => {
	const infoBlockList = deserializingData.split(';');

	// 尺寸
	const resizeInfo = infoBlockList[0];
	const resizeList = resizeInfo.split(',');
	const width = Convert.toNumber(resizeList[0]);
	const parentWidthOfResize = Convert.toNumber(resizeList[1]);


	// 位置
	const positionInfo = infoBlockList[1];
	const positionList = positionInfo.split(',');
	const left = Convert.toNumber(positionList[0]);
	const parentWidthOfPosition = Convert.toNumber(positionList[1]);
	const top = Convert.toNumber(positionList[2]);
	const parentHeight = Convert.toNumber(positionList[3]);

	// 时间轴
	const referencePointListInfo = infoBlockList[2];
	/** @type {referencePoint[]} */
	const referencePointList = [];
	for (const referencePointString of referencePointListInfo.split(',')) {
		const list = referencePointString.split('>');
		const originalTime = Convert.toNumber(list[0]);
		const externalVideoTime = Convert.toNumber(list[1]);
		referencePointList.push({
			originalTime,
			externalVideoTime,
		})
	}

	return {
		width,
		parentWidthOfResize,

		left,
		parentWidthOfPosition,
		top,
		parentHeight,

		referencePointList,
	}
};


/**
 *
 * @param {number} originalTime
 * @param {number} externalVideoTime
 * @return {ChildNode}
 */
const createReferencePointLineNodeOnly = (originalTime, externalVideoTime) => {
	const referencePointLine = ReferencePointLine.create();
	ReferencePointLine.setTimeBySeconds(referencePointLine, originalTime, externalVideoTime);
	ReferencePointLine.setDeleteCallback(referencePointLine, () => {
		buildEditPage(editingContentLine);
	});
	panel.querySelector('.__sign_SHAS_panel .main .editPage .content').appendChild(referencePointLine);
	return referencePointLine
};

// 构建编辑页的时间戳列表
const buildEditPage = (contentLine) => {
	clearReferencePointLineNode();
	const {versions, referencePointList} = externalVideoHub.getReferencePointAll(contentLine);
	for (const {originalTime, externalVideoTime} of referencePointList) {
		// const referencePointLine = createReferencePointLineNodeOnly();
		// ReferencePointLine.setTimeBySeconds(referencePointLine, originalTime, externalVideoTime);
		createReferencePointLineNodeOnly(originalTime, externalVideoTime);
	}
};

const clearReferencePointLineNode = () => {
	[...panel.querySelectorAll('.__sign_SHAS_referencePointLine')].forEach(node => node.remove());
};

const pageType = {
	list: Symbol('list'),
	edit: Symbol('edit'),
};

// 切换到页面
const panelPage = (() => {

	let currentPage = pageType.list;

	const hideAllPage = () => {
		for (const page of panel.querySelectorAll('.page')) {
			page.classList.add('hide');
		}
	};

	const backButton = {
		hide() {
			panel.querySelector('.back').style.display = 'none';
		},

		display() {
			panel.querySelector('.back').style.display = 'block';
		}
	};

	return {
		// 切换到列表页
		toList() {
			currentPage = pageType.list;
			hideAllPage();
			panel.querySelector('.listPage').classList.remove('hide');
			editingContentLine = null;
			backButton.hide();
			MeasuringBlock.allExitEditMode();
			// bilibiliPlayerVideoController.relieve();
		},

		// 切换到编辑页
		toEdit(contentLine) {
			currentPage = pageType.edit;
			hideAllPage();
			editingContentLine = contentLine;
			const name = ListContentLine.getName(contentLine);
			// const videoUrl = ListContentLine.getVideoUrl(contentLine);
			// bilibiliPlayerVideoController.pauseAndBan();

			// 构建编辑页的时间戳列表
			{
				buildEditPage(contentLine);
			}

			// 显示对应外挂视频的测量块
			{
				const measuringBlock = externalVideoHub.getMeasuringBlock(contentLine);
				if (measuringBlock) {
					MeasuringBlock.alwaysShow(measuringBlock);
					MeasuringBlock.editMode(measuringBlock);
				}
			}

			panel.querySelector('.editPage').classList.remove('hide');
			panel.querySelector('.editPage_title').textContent = name;
			backButton.display();
		},

		get currentPage() {
			return currentPage
		},
	}
})();



// 面板初始化
const initPanel = () => {

	{
		panel.style.left = `${(window.innerWidth - panelConfig.width) / 2 }px`;
		panel.style.top = '100px';
		panel.style.width = `${panelConfig.width}px`;
		panel.style.height = `${panelConfig.height}px`;
	}

	document.body.appendChild(panel);

	// 编辑页左下角的外挂视频当前时间提示
	{
		const showExternalVideoTimeNode = panel.querySelector('.editPage_bottom_externalVideoTime');
		bilibiliPlayerVideoController.videoTrigger(() => {
			if (panelPage.currentPage === pageType.edit) {
				const {currentTime, duration} = MeasuringBlock.getVideoInfo(externalVideoHub.getMeasuringBlock(editingContentLine));
				// const {currentTime, duration} = editingContentLine |> externalVideoHub.getMeasuringBlock |> MeasuringBlock.getVideoInfo;
				const {milliseconds, seconds, minutes, hours} = parseTime.secondsToTime(currentTime);
				showExternalVideoTimeNode.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
			}
		});
	}


	// 拖拽
	{
		const dragRegion = panel.querySelector('.top .left');
		barDrag(dragRegion, panel);
	}

	// 面板关闭按钮
	panel.querySelector('.top .right').addEventListener('click', Panel.close);

	// 点击事件
	{
		// 列表页的新建按钮
		panel.querySelector('.create_new_line_button').addEventListener('click', () => {
			createLine();

		});

		// 编辑页的新建时间戳按钮
		panel.querySelector('.editPage_newPoint').addEventListener('click', () => {
			const {currentTime} = MeasuringBlock.getVideoInfo(externalVideoHub.getMeasuringBlock(editingContentLine));
			const originalTime = Convert.toNumber(bilibiliPlayerVideo.currentTime.toFixed(3));
			const externalVideoTime = Convert.toNumber(currentTime.toFixed(3));
			createReferencePointLineNodeOnly(originalTime, externalVideoTime);
			externalVideoHub.addReferencePoint(editingContentLine, {
				originalTime,
				externalVideoTime,
			});
			bilibiliPlayerVideoController.syncVideo();
		});

		// 返回到列表页的按钮
		panel.querySelector('.back').addEventListener('click', () => {
			panelPage.toList();
			bilibiliPlayerVideoController.syncVideo();
		});

		// 编辑页的复制配置按钮
		panel.querySelector('.editPage_export').addEventListener('click', () => {
			const configText = externalVideoHub.serialize(editingContentLine);
			if (configText) {
				const list = externalVideoHub.getReferencePointAll(editingContentLine);
				// 没有添加参考基准点时不可导出
				if (list.referencePointList.length > 0) {
					navigator.clipboard.writeText(configText).then();
				}
			}
		});

	}

	// 粘贴事件
	{
		// panel.addEventListener没效果
		window.addEventListener('paste', (event) => {
			const {clipboardData} = event;
			if (panelPage.currentPage === pageType.list && isOpen) {
				const text = clipboardData.getData('text/plain');
				searchDeserializingData(text).forEach(({deserializingData, description}) => createLineByDeserialize(deserializingData, description));
			}
		});
	}
};



const Panel = {
	/**
	 * @return {boolean}
	 */
	get initialised() {
		return !firstOpen
	},

	get panelNode() {
		return panel
	},

	get editingContentLine() {
		return editingContentLine
	},

	open() {
		isOpen = true;
		if (firstOpen) {
			firstOpen = false;
			initPanel();
		}
		panel.classList.remove('hide');
	},

	close() {
		panelPage.toList();
		isOpen = false;
		panel.classList.add('hide');
	},

	toggle() {
		if (isOpen) {
			this.close();
		} else {
			this.open();
		}
	},

	toList() {
		panelPage.toList();
	},

	/**
	 * 导入配置字符串创建挂载视频
	 * @param {string} deserializingData
	 * @param {?string} description
	 */
	createLineByDeserialize(deserializingData, description = null) {
		createLineByDeserialize(deserializingData, description);
	},
};

export default Panel;