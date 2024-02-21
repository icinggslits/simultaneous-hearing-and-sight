import {clog} from './unit.js';
import {regularExpression, searchDeserializingData} from './externalVideoHub.js';
import Panel from './panel.js';


const replyList = document.querySelector('.left-container-under-player');

if (replyList) {
	const options = {childList: true, subtree: true};

	const replyContentNode = new Set();

	const ob = new MutationObserver((mutations, observer) => {

		const nodeList = [];

		for (const mutation of mutations) {
			const {target} = mutation;
			if (target.classList.contains('reply-content') && !replyContentNode.has(target)) {
				replyContentNode.add(target);
				nodeList.push(target);
			}
		}

		observer.disconnect();
		nodeList.forEach(node => {
			const pattern = regularExpression.patternCompletely;

			node.innerHTML = node.innerHTML.replaceAll(pattern, (text) => `<span class="__sign_SHAS_replyListImport">${text}</span>`);
			for (const clickNode of node.querySelectorAll('.__sign_SHAS_replyListImport')) {
				clickNode.addEventListener('click', () => {
					const data = searchDeserializingData(clickNode.textContent);
					// length只会是1
					if (data.length > 0) {
						const [{deserializingData, description}] = data;
						Panel.createLineByDeserialize(deserializingData, description);
						Panel.open();
						Panel.toList();
					}
				});
			}

		});
		observer.observe(replyList, options);
	});

	ob.observe(replyList, options);
}



