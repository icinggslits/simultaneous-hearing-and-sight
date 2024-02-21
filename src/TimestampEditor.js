import {Convert, createNode, debounceExecuteBuilder, parseTime} from './unit.js';
import {bilibiliPlayerVideoController} from './bilibiliPlayerVideoEvent.js';

const editingCb = Symbol();

const TimestampEditor = {
	create() {
		const timestampEditor = createNode(`
				<div class="__sign_SHAS_timestampEditor">
					<div class="__sign_SHAS_timestampEditor_hours" data-hours="0">00</div>
					<div class="__sign_SHAS_timestampEditor_semicolon">：</div>
					<div class="__sign_SHAS_timestampEditor_minutes" data-minutes="0">00</div>
					<div class="__sign_SHAS_timestampEditor_semicolon">：</div>
					<div class="__sign_SHAS_timestampEditor_seconds" data-seconds="0">00</div>
					<div class="__sign_SHAS_timestampEditor_semicolon">，</div>
					<div class="__sign_SHAS_timestampEditor_milliseconds" data-milliseconds="0">000</div>
				</div>
			`);

		const syncVideo = debounceExecuteBuilder(() => {
			bilibiliPlayerVideoController.syncVideo();
		}, 100);

		const editing = () => {
			// 触发回调
			timestampEditor?.[editingCb]?.();

			// 同步挂载视频画面
			syncVideo();
		};

		timestampEditor.querySelector('.__sign_SHAS_timestampEditor_hours').addEventListener('wheel', (event) => {
			const {deltaY, shiftKey} = event;
			const hours = (() => {
				if (shiftKey) {
					return 10
				} else {
					return 1
				}
			})();

			if (deltaY > 0) {
				TimestampEditor.hours(timestampEditor, -hours);
			} else if (deltaY < 0) {
				TimestampEditor.hours(timestampEditor, hours);
			}
			event.preventDefault();
			editing();
		});

		timestampEditor.querySelector('.__sign_SHAS_timestampEditor_minutes').addEventListener('wheel', (event) => {
			const {deltaY, shiftKey} = event;
			const minutes = (() => {
				if (shiftKey) {
					return 10
				} else {
					return 1
				}
			})();

			if (deltaY > 0) {
				TimestampEditor.minutes(timestampEditor, -minutes);
			} else if (deltaY < 0) {
				TimestampEditor.minutes(timestampEditor, minutes);
			}
			event.preventDefault();
			editing();
		});

		timestampEditor.querySelector('.__sign_SHAS_timestampEditor_seconds').addEventListener('wheel', (event) => {
			const {deltaY, shiftKey} = event;
			const seconds = (() => {
				if (shiftKey) {
					return 10
				} else {
					return 1
				}
			})();

			if (deltaY > 0) {
				TimestampEditor.seconds(timestampEditor, -seconds);
			} else if (deltaY < 0) {
				TimestampEditor.seconds(timestampEditor, seconds);
			}
			event.preventDefault();
			editing();
		});

		timestampEditor.querySelector('.__sign_SHAS_timestampEditor_milliseconds').addEventListener('wheel', (event) => {
			const {deltaY, shiftKey, altKey} = event;
			const milliseconds = (() => {
				if (shiftKey && altKey) {
					return 1
				} else if (shiftKey) {
					return 10
				} else {
					return 100
				}
			})();

			if (deltaY > 0) {
				TimestampEditor.milliseconds(timestampEditor, -milliseconds);
			} else if (deltaY < 0) {
				TimestampEditor.milliseconds(timestampEditor, milliseconds);
			}
			event.preventDefault();
			editing();
		});



		return timestampEditor
	},

	/**
	 * 获取时间
	 * @param timestampEditor
	 * @return {{hours: number, minutes: number, seconds: number, milliseconds: number}}
	 */
	getTime(timestampEditor) {
		const hoursNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_hours');
		const minutesNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_minutes');
		const secondsNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_seconds');
		const millisecondsNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_milliseconds');
		const hours = Convert.toNumber(hoursNode.dataset.hours);
		const minutes = Convert.toNumber(minutesNode.dataset.minutes);
		const seconds = Convert.toNumber(secondsNode.dataset.seconds);
		const milliseconds = Convert.toNumber(millisecondsNode.dataset.milliseconds);

		return {hours, minutes, seconds, milliseconds}
	},

	/**
	 * 获取表示总秒数的时间
	 * @param timestampEditor
	 * @return {number}
	 */
	getTimeOfSeconds(timestampEditor) {
		const {hours, minutes, seconds, milliseconds} = this.getTime(timestampEditor);
		return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
	},

	/**
	 *
	 * @param timestampEditor
	 * @param {number} hours
	 */
	setHours(timestampEditor, hours) {
		const hoursNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_hours');
		const hoursString = hours.toString();
		hoursNode.textContent = hoursString.padStart(2, '0');
		hoursNode.dataset.hours = hoursString;
	},

	/**
	 *
	 * @param timestampEditor
	 * @param {number} minutes
	 */
	setMinutes(timestampEditor, minutes) {
		const minutesNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_minutes');
		const minutesString = minutes.toString();
		minutesNode.textContent = minutesString.padStart(2, '0');
		minutesNode.dataset.minutes = minutesString;
	},

	/**
	 *
	 * @param timestampEditor
	 * @param {number} seconds
	 */
	setSeconds(timestampEditor, seconds) {
		const secondsNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_seconds');
		const secondsString = seconds.toString();
		secondsNode.textContent = secondsString.padStart(2, '0');
		secondsNode.dataset.seconds = secondsString;
	},

	/**
	 *
	 * @param timestampEditor
	 * @param {number} milliseconds
	 */
	setMilliseconds(timestampEditor, milliseconds) {
		const millisecondsNode = timestampEditor.querySelector('.__sign_SHAS_timestampEditor_milliseconds');
		const millisecondsString = milliseconds.toString();
		millisecondsNode.textContent = millisecondsString.padStart(3, '0');
		millisecondsNode.dataset.milliseconds = millisecondsString;
	},

	/**
	 *
	 * @param timestampEditor
	 * @param {number} seconds
	 */
	setTimeBySeconds(timestampEditor, seconds) {
		const {hours, minutes, seconds: remainderSeconds, milliseconds} = parseTime.secondsToTime(seconds);
		this.setHours(timestampEditor, hours);
		this.setMinutes(timestampEditor, minutes);
		this.setSeconds(timestampEditor, remainderSeconds);
		this.setMilliseconds(timestampEditor, milliseconds);
	},

	hours(timestampEditor, hours) {
		const {hours: currentHours} = this.getTime(timestampEditor);
		this.setHours(timestampEditor, Convert.limits(currentHours + hours, 0, 99));
	},

	minutes(timestampEditor, minutes) {
		const {hours, minutes: currentMinutes} = this.getTime(timestampEditor);
		// 99*60+59=5999
		const totalMinutes = Convert.limits(hours * 60 + currentMinutes + minutes, 0, 5999);
		this.setHours(timestampEditor, Math.floor(totalMinutes / 60));
		this.setMinutes(timestampEditor, totalMinutes % 60);
	},

	seconds(timestampEditor, seconds) {
		const {hours, minutes, seconds: currentSeconds} = this.getTime(timestampEditor);
		// 99*3600+59*60=359940
		const totalSeconds = Convert.limits(hours * 3600 + minutes * 60 + currentSeconds + seconds, 0, 359940);
		this.setHours(timestampEditor, Math.floor(totalSeconds / 3600));
		this.setMinutes(timestampEditor, Math.floor((totalSeconds % 3600) / 60));
		this.setSeconds(timestampEditor, totalSeconds % 60);
	},

	milliseconds(timestampEditor, milliseconds) {
		const {hours, minutes, seconds, milliseconds: currentMilliseconds} = this.getTime(timestampEditor);
		const totalSeconds = Convert.limits(hours * 3600 + minutes * 60 + seconds + (currentMilliseconds + milliseconds) / 1000, 0, 359940);
		this.setHours(timestampEditor, Math.floor(totalSeconds / 3600));
		this.setMinutes(timestampEditor, Math.floor((totalSeconds % 3600) / 60));
		this.setSeconds(timestampEditor, Math.floor(totalSeconds % 60));

		// 精度问题
		if (seconds >= 1 || minutes >= 1 || hours >= 1) {
			this.setMilliseconds(timestampEditor, (currentMilliseconds + Math.ceil(Math.abs(milliseconds / 1000)) * 1000 + milliseconds) % 1000);
		} else {
			if (currentMilliseconds + milliseconds < 0) {
				this.setMilliseconds(timestampEditor, 0);
			} else {
				this.setMilliseconds(timestampEditor, (currentMilliseconds + Math.ceil(Math.abs(milliseconds / 1000)) * 1000 + milliseconds) % 1000);
			}
		}
	},

	/**
	 *
	 * @param timestampEditor
	 * @param {function} cb
	 */
	editing(timestampEditor, cb) {
		timestampEditor[editingCb] = cb;
	},
};


export default TimestampEditor;