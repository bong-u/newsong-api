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
		
		fetch('http://newsongg.run.goorm.io/login', { method: 'POST', body : formData })
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
	    ID
		<input id='id' type="text" name="username"/>
        <br/>
        PW
		<input id='pw' type="password" name="password"/>
		<br/>
		<button id="loginBtn">login</button>
	</form>
</main>

<style>
    form#loginForm {
        display : flex;
        flex-direction: column;
        align-items: center;
    }
    button#loginBtn {
        border: none;
        background-color: inherit;
        width: 100px;
        height: 50px;
        font-size: 16px;
        cursor: pointer;
        display: inline-block;
    }
    
    button#loginBtn:hover { animation: hover 0.5s forwards; }
    @-webkit-keyframes hover { to {background-color: #f73c00; color:white; } }
</style>