<script>
	import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
	
	export let logined = false;
	let username = '';
	let token = '';
	
	$: (() => {
    	dispatch('loginProps', { logined, username, token })
    })();
	
	function loginProc() {
		let formData = new FormData(document.getElementById('loginForm'));
        
        if (formData.get('username') == '' || formData.get('password') == '') {
            alert('Username, password both required');
            return;
        }
		
		fetch(window.location.href + 'login', { method: 'POST', body : formData })
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
	}
		
</script>

<main>

	{#if !logined}
		
        <form id="loginForm" on:submit|preventDefault={ loginProc }>
            ID
            <input id='id' type="text" name="username"/>
            <br/>
            PW
            <input id='pw' type="password" name="password"/>
            <br/>
            <button id='loginBtn'>login</button>
        </form>
    {:else}
        <button id='logoutBtn'>logout</button>
	{/if}
</main>

<style>
    form#loginForm {
        display : flex;
        flex-direction: column;
        align-items: center;
    }
    
    button {
        height: 50px;
        font-size: 18px;
    }
    
    button#loginBtn { width: 90px; }
    button#logoutBtn { width: 100px; }
    
    button#loginBtn:hover { animation: hoverBtnAnim 0.5s forwards; }
    button#logoutBtn:hover { animation: hoverBtnAnim 0.5s forwards; }
</style>