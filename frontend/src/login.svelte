<script>
	import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	
	let logined = false;
	let username = '';
	let token = '';
	let searchResult = [];
	
	$: (() => {
    	dispatch('loginProps', { logined, username, token })
    })();
	
	function loginProc() {
		let formData = new FormData(document.getElementById('loginForm'));
		
		fetch('http://bongg.run.goorm.io/login', { method: 'POST', body : formData })
		.then( resp => { return resp.json(); })
		.then( resp => {
			if (! resp.access_token) {		//login failed
				alert (resp.detail);
				return;
			}
			
			logined = true;
			token = resp.access_token;
			username = formData.get('username');
		})
		.catch(error => {
			console.error(error);
		});
	}
	
	
	function logout() {
		logined = false;
		token = '';
		username = '';
		searchResult = [];
	}
		
</script>

<main>
	<form id="loginForm" on:submit|preventDefault={ loginProc }>
	
		<input type="text" name="username"/>
		<input type="password" name="password"/>
		
		<button id="loginBtn">login</button>
	</form>
</main>

<style>
</style>