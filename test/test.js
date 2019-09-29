import Component from '@ember/component';
import { tryInvoke } from '@ember/utils';
/**
	Attributes
	0. a1
	1. a2
	2. a3
	3. a4
	4. a5
	5. a6
	6. a7
	7. a8
	8. a9
	9. a10
	10. a11
	11. a12
	12. a13
	13. a14
	14. a15
	15. a16
	16. a17
	17. a18
	18. a19
	19. a20
	20. a21
	21. a22
	22. a23
	23. a24
	24. a25
	25. a26
	26. a27
	27. a28
	28. a29
	29. a30

	Actions
	action
	action1
	action2
	action3
**/
export default Component.extend({
	actions: {
		action: {
			tryInvoke(this, 'action');
		},
		action1: {
			tryInvoke(this, 'action1');
		},
		action2: {
			tryInvoke(this, 'action2');
		},
		action3: {
			tryInvoke(this, 'action3');
		},
}
});