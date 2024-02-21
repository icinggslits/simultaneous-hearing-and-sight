import {clog, createNode} from './unit.js';
import TimestampEditor from './TimestampEditor.js';
import timestampEditor from './TimestampEditor.js';
import externalVideoHub from './externalVideoHub.js';
import Panel from './panel.js';

const originalVideoAttr = Symbol();
const externalVideoAttr = Symbol();
const deleteCallbackAttr = Symbol();

const ReferencePointLine = {
	/**
	 * 是否是ReferencePointLine对象
	 * @param referencePointLine
	 * @return {boolean}
	 */
	is(referencePointLine) {
		return !!referencePointLine?.classList?.contains('.__sign_SHAS_referencePointLine')
	},

	create() {
		const referencePointLine = createNode(`
				<div class="__sign_SHAS_referencePointLine">
					<div class="__sign_SHAS_referencePointLine_timestampEditorOfOriginalVideo"></div>
					<div class="__sign_SHAS_referencePointLine_timestampEditorOfExternalVideo"></div>
					<div class="__sign_SHAS_referencePointLine_delete">✖</div>
				</div>
			`);

		const timestampEditorOfOriginalVideo = TimestampEditor.create();
		referencePointLine[originalVideoAttr] = timestampEditorOfOriginalVideo;
		TimestampEditor.editing(timestampEditorOfOriginalVideo, () => {
			const timeOfSeconds = TimestampEditor.getTimeOfSeconds(timestampEditorOfOriginalVideo);
			externalVideoHub.setOriginalTimeOfReferencePoint(referencePointLine, timeOfSeconds);
		});
		referencePointLine.querySelector('.__sign_SHAS_referencePointLine_timestampEditorOfOriginalVideo')
			.appendChild(timestampEditorOfOriginalVideo);

		const timestampEditorOfExternalVideo = TimestampEditor.create();
		referencePointLine[externalVideoAttr] = timestampEditorOfExternalVideo;
		TimestampEditor.editing(timestampEditorOfExternalVideo, () => {
			const timeOfSeconds = TimestampEditor.getTimeOfSeconds(timestampEditorOfExternalVideo);
			externalVideoHub.setExternalVideoTimeBySeconds(referencePointLine, timeOfSeconds);
		});
		referencePointLine.querySelector('.__sign_SHAS_referencePointLine_timestampEditorOfExternalVideo')
			.appendChild(timestampEditorOfExternalVideo);


		referencePointLine.querySelector('.__sign_SHAS_referencePointLine_delete')
			.addEventListener('click', () => {
				externalVideoHub.deleteReferencePoint(referencePointLine);
				referencePointLine?.[deleteCallbackAttr]?.();
		});


		return referencePointLine
	},

	setOriginalTimeBySeconds(referencePointLine, seconds) {
		const timestampEditorOfOriginalVideo = referencePointLine[originalVideoAttr];
		TimestampEditor.setTimeBySeconds(timestampEditorOfOriginalVideo, seconds);
	},

	setExternalVideoTimeBySeconds(referencePointLine, seconds) {
		const timestampEditorOfExternalVideo = referencePointLine[externalVideoAttr];
		TimestampEditor.setTimeBySeconds(timestampEditorOfExternalVideo, seconds);
	},

	setTimeBySeconds(referencePointLine, originalTime, externalVideoTime) {
		this.setOriginalTimeBySeconds(referencePointLine, originalTime);
		this.setExternalVideoTimeBySeconds(referencePointLine, externalVideoTime);
	},

	/**
	 *
	 * @param referencePointLine
	 * @param {function} cb
	 */
	setDeleteCallback(referencePointLine, cb) {
		referencePointLine[deleteCallbackAttr] = cb;
	},

};


export default ReferencePointLine;