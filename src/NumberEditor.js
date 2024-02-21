import {Convert, createNode} from './unit.js';

/**
 * 变更数字时的回调
 * @callback numberEditorCallback
 * @param {{originalNumber: number, currentNumber: number}} numberEditorInfo
 */


const numberNodeAttr = Symbol();

/**
 *
 * @type {numberEditorCallback[]}
 */
const editingCallbackList = [];

const NumberEditor = {

	is(numberEditor) {
		return !!numberEditor?.classList?.contains('content_line')
	},

	create(defaultNumber = 60) {
		const numberEditor = createNode(`
			<div class="__sign_SHAS_numberEditor">
				<div class="__sign_SHAS_numberEditor_number">
				  ${defaultNumber}
				</div>
			</div>
		`);

		numberEditor[numberNodeAttr] = numberEditor.querySelector('.__sign_SHAS_numberEditor_number');

		numberEditor.addEventListener('wheel', (event) => {
			const {deltaY, shiftKey} = event;
			const number = (() => {
				if (shiftKey) {
					return 1
				} else {
					return 5
				}
			})();

			if (deltaY > 0) {
				this.add(numberEditor, -number);
			} else if (deltaY < 0) {
				this.add(numberEditor, number);
			}

			event.preventDefault();
		});


		return numberEditor
	},

	/**
	 *
	 * @param numberEditor
	 * @param {number} number
	 */
	add(numberEditor, number) {
		const originalNumber = Convert.toNumber(numberEditor[numberNodeAttr].textContent);
		const currentNumber = Convert.limits(originalNumber + number, 0, 100);
		if (originalNumber !== currentNumber) {
			numberEditor[numberNodeAttr].textContent = currentNumber;
			editingCallbackList.forEach(cb => cb({originalNumber, currentNumber}))
		}
	},

	/**
	 *
	 * @param numberEditor
	 * @param {numberEditorCallback} cb
	 */
	editing(numberEditor, cb) {
		editingCallbackList.push(cb);
	},

	/**
	 *
	 * @param numberEditor
	 * @return {number}
	 */
	getNumber(numberEditor) {
		return Convert.toNumber(numberEditor[numberNodeAttr].textContent)
	},

};





export default NumberEditor



