const clog = console.log;

/**
 * 测试用
 * @param key {string}
 * @param fn {function}
 */
const debugCapture = (key, fn) => {
	window.addEventListener('keydown', event => {
		if (event.key === key) {
			if (fn instanceof Function) {
				clog(`按下了${event.key}`);
				fn();
			} else {
				clog(fn);
			}
		}
	});
};

const Convert = {
	/**
	 * 转换为数字
	 * @param value {any}
	 * @param unable {number}
	 * @return {number}
	 */
	toNumber(value, unable = 0) {
		let result = unable;
		switch (true) {
			case typeof value === 'string': (() => {
				result = Number(value.replace(/[^\d.-]/ig, ''));
			})();
				break;
			case typeof value === 'number': (() => {
				result = value;
			})();
				break;
		}

		if(isFinite(result)){
			return result;
		}else{
			return unable;
		}
	},
	/**
	 * 是否是数字
	 *
	 * 字符串'25' - true
	 *
	 * @param value {any}
	 * @return {boolean}
	 */
	isNumber(value) {
		return !isNaN(parseFloat(value)) && isFinite(value);
	},
	/**
	 * 过滤虚值返回规定的值
	 * @param value
	 * @param unreal
	 * @return {*|null}
	 */
	toReal(value, unreal = null) {
		if(!Convert.isReal(value)){
			return unreal;
		}else{
			return value;
		}
	},
	/**
	 * 是否是实在的值
	 * @param value {any}
	 * @return {boolean}
	 */
	isReal(value) {
		return !(value === undefined || value === null || Number.isNaN(value));
	},
	/**
	 * 转为Array
	 * @template T
	 * @param value {T}
	 * @param arrayInArray {boolean} 是否包含数组
	 * @return {T[]}
	 */
	toList(value, arrayInArray = false) {
		if (Array.isArray(value) && Array.isArray(value[0]) === arrayInArray) {
			return value;
		} else {
			return [value];
		}
	},
	/**
	 * 限制number在lower<=number<=upper之间，返回这个数
	 * @param number {number}
	 * @param lower {number}
	 * @param upper {number}
	 * @return {number}
	 */
	limits(number, lower, upper) {
		return this.lowerLimit(this.upperLimit(number, upper), lower)
	},
	/**
	 * 限制number在number<=upper之间，返回这个数
	 * @param number
	 * @param upper
	 * @return {number}
	 */
	upperLimit(number, upper) {
		if (number > upper) {
			return upper
		} else {
			return number
		}
	},
	/**
	 * 限制number在lower<=number之间，返回这个数
	 * @param number
	 * @param lower
	 * @return {number}
	 */
	lowerLimit(number, lower) {
		if (number < lower) {
			return lower
		} else {
			return number
		}
	},
	/**
	 * 是否是Error
	 * @param object
	 * @return {boolean}
	 */
	isError(object) {
		return Error.prototype.isPrototypeOf(object)
	}
}


const Range = document.createRange();
/**
 * 创建DOM节点
 *
 * 必须只有一个根节点
 *
 * @param fragment {string}
 */
const createNode = (fragment) => {
	const contextualFragment = Range.createContextualFragment(fragment.trim());
	return contextualFragment.childNodes[0]
}

const mouseDrag = (() => {

	// 按住
	let press = false;
	let isTarget = false;
	/**
	 * @type {function}
	 */
	let targetCb;
	let original_x = 0;
	let original_y = 0;
	let onceData;

	const targetDomList = [];

	document.addEventListener('pointerdown', (event) => {
		const {x, y} = event;
		// document.elementFromPoint(event.clientX, event.clientY)
		press = true;
		original_x = x;
		original_y = y;

		for (const [el, cb, onceCb] of targetDomList) {
			if (document.elementFromPoint(x, y) === el) {
				isTarget = true;
				targetCb = cb;
				onceData = onceCb?.();
				event.preventDefault();
				break;
			}
		}
	});

	document.addEventListener('pointerup', (event) => {
		press = false;
		isTarget = false;
	});

	document.addEventListener('pointermove', (event) => {
		if (press && isTarget) {
			const {x, y} = event;
			targetCb({
				original_x,
				original_y,
				x,
				y,
				diff_x: x - original_x,
				diff_y: y - original_y,
				onceData,
			});
		}
	});



	/**
	 *
	 * @param el {Element | ChildNode}
	 * @param cb {dragInfoCallback}
	 */
	return (el, cb, onceCb) => {
		targetDomList.push([el, cb, onceCb]);
	}
})();


const barDrag = (() => {
	return (bar, body, limitNode = null) => {
		let original_left = 0;
		let original_top = 0;

		document.addEventListener('pointerdown', (event) => {
			const {x, y} = event;
			if (document.elementFromPoint(x, y) === bar) {
				original_left = Convert.toNumber(body.style.left);
				original_top = Convert.toNumber(body.style.top);
			}
		});

		mouseDrag(bar, (dragInfo) => {
			const {diff_x, diff_y} = dragInfo;
			body.style.left = `${original_left + diff_x}px`;
			body.style.top = `${original_top + diff_y}px`;
		});
	}
})();


const formatTime = {
	/**
	 *
	 * @param {number} seconds
	 * @return {string}
	 */
	ofSeconds(seconds) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		const formattedHours = hours.toString().padStart(2, '0');
		const formattedMinutes = minutes.toString().padStart(2, '0');
		const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0');

		return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
	},

	/**
	 *
	 * @param {number} hours
	 * @param {number} minutes
	 * @param {number} seconds
	 * @param {number} milliseconds
	 * @return {string}
	 */
	ofTime(hours, minutes, seconds, milliseconds = 0) {
		return this.ofSeconds(hours * 3600 + minutes * 60 + seconds + milliseconds / 1000)
	}
};


/**
 * 获取用户选择的单文件，如果用户取消选择，那么Promise不会有承诺
 * @param {string} suffix
 * @return {Promise<File>}
 */
const userSelectFile = (suffix) => {
	return new Promise((resolve, reject) => {
		const inputFileNode = createNode(`<input type="file" accept="${suffix}" />`);
		inputFileNode.addEventListener('change', () => {
			resolve(inputFileNode.files[0]);
			inputFileNode.remove();
		});
		inputFileNode.click();
	})
};

/**
 * 秒转格式化时间戳字符串
 * @param {number} seconds
 * @return {string}
 */
const formatTimestamp = (seconds) => {
	// 将秒数转换为毫秒
	const milliseconds = Math.floor(seconds * 1000);

	// 创建一个日期对象，设置时间为毫秒数对应的时间
	const date = new Date(milliseconds);

	// 提取小时、分钟和秒
	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	const secondsText = date.getUTCSeconds().toString().padStart(2, '0');


	if (hours === 0) {
		const minutesText = minutes.toString();
		return `${minutesText}:${secondsText}`
	} else {
		const minutesText = minutes.toString().padStart(2, '0');
		return `${hours}:${minutesText}:${secondsText}`
	}
};



// 解析时间戳字符串
const parseTimestamp = {
	/**
	 * 解析时间戳字符串为时分秒
	 * @param {string} timestamp
	 * @return {{hours: number, seconds: number, minutes: number}}
	 */
	toTime(timestamp) {
		// 将时间戳字符串拆分为时、分、秒和毫秒部分
		let [hours, minutes, secondsAndMilliseconds] = timestamp.split(':');

		// 将秒和毫秒部分拆分为秒和毫秒
		let [seconds, milliseconds] = secondsAndMilliseconds.split(',');

		// 将时、分、秒和毫秒部分转换为整数
		hours = parseInt(hours);
		minutes = parseInt(minutes);
		seconds = parseInt(seconds);
		milliseconds = parseInt(milliseconds);

		return { hours, minutes, seconds }
	},

	/**
	 * 解析时间戳字符串为秒
	 * @param {string} timestamp
	 * @return {number}
	 */
	toSeconds(timestamp) {
		const {hours, minutes, seconds} = this.toTime(timestamp);
		return hours * 3600 + minutes * 60 + seconds
	},
}

const parseTime = {

	/**
	 *
	 * @param {number} seconds
	 * @return {{milliseconds: number, hours: number, seconds: number, minutes: number}}
	 */
	secondsToTime(seconds) {
		// 将秒数转换为毫秒
		const milliseconds = Math.floor(seconds * 1000);
		const date = new Date(milliseconds);

		const hours = date.getUTCHours();
		const minutes = date.getUTCMinutes();
		const remainderSeconds = date.getUTCSeconds();
		const remainderMilliseconds = date.getUTCMilliseconds()

		return {
			hours,
			minutes,
			seconds: remainderSeconds,
			milliseconds: remainderMilliseconds,
		}
	},
};


class Trigger {
	#intervals = 10
	/** @type function */
	#cb;
	#timeoutID;
	#inProgress = false;

	/**
	 *
	 * @param {function} cb
	 * @param {number} intervals
	 */
	constructor(cb, intervals) {
		this.#intervals = intervals;
		this.#cb = cb;
	}

	stop() {
		if (this.#inProgress) {
			this.#inProgress = false;
			clearTimeout(this.#timeoutID);
		}
	}

	start() {
		if (!this.#inProgress) {
			this.#inProgress = true;
			this.#cb();
			this.#execute();
		}
	}

	#execute() {
		this.#timeoutID = setTimeout(() => {
			this.#cb();
			this.#execute();
		}, this.#intervals);
	}
}

/**
 *
 * @param {function} cb
 * @param {number} intervals
 * @return {Trigger}
 */
const triggerBuilder = (cb, intervals = 100) => new Trigger(cb, intervals);


/**
 *
 * @param {number[]} numberList
 * @param {number} x
 * @return {number}
 */
const findInsertIndex = (numberList, x) => {
	let low = 0;
	let high = numberList.length - 1;
	while (low <= high) {
		let mid = Math.floor((low + high) / 2);
		if (numberList[mid] === x) {
			return mid;
		} else if (numberList[mid] < x) {
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}
	return low
}

/**
 * 创建防抖milliseconds毫秒的函数
 * @param {function} fn
 * @param {number} milliseconds
 * @return {function}
 */
const debounceExecuteBuilder = (fn, milliseconds = 300) => {
	const timeoutIDAttr = Symbol();
	const debounceFn = () => {
		clearTimeout(debounceFn[timeoutIDAttr]);
		debounceFn[timeoutIDAttr] = setTimeout(() => fn(), milliseconds);
	};
	debounceFn[timeoutIDAttr] = -1;

	return debounceFn
};


export {
	clog,
	debugCapture,
	createNode,
	Convert,
	mouseDrag,
	barDrag,
	formatTime,
	userSelectFile,
	formatTimestamp,
	parseTimestamp,
	parseTime,
	triggerBuilder,
	findInsertIndex,
	debounceExecuteBuilder,
};



