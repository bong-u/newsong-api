import MainApp from './index.svelte';
import AddApp from './login.svelte';

export const main = new MainApp({
	target: document.getElementById('MainApp'),
	props: {}
});

export const add = new AddApp({
	target: document.getElementById('AddApp'),
	props: {}
});
