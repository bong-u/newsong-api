<script>
	import ListApp from './list.svelte'
	import AddApp from './add.svelte'
	import LoginApp from './login.svelte'
	
	const status = {'LIST':0, 'ADD':1, 'LOGIN':2};
	Object.freeze(status);
	
	$ : current = status.LIST;
	$ : logined = false;
	$ : username = '';
	$ : token = '';
	
	function setStatus(status) {
		current = status;
	}
	
	const loginProps = (e) => {
		logined = e.detail.logined;
		username = e.detail.username;
		token = e.detail.token;
	}
    
    function logout() {
    
    }
	
</script>

<main>
    <div id='greeting'>
	{#if logined}
		{ username } logined!
        <span>|</span>
		<button id="logoutBtn" on:click= { logout } >logout</button>
    {:else}
        welcome!
	{/if}
    </div>
    <div id='nav'>
        <button class='menuBtn' on:click={() => setStatus(status.LIST) }>main</button>
        <span>|</span>
        <button class='menuBtn' on:click={() => setStatus(status.ADD) }>add</button>
        <span>|</span>
        <button class='menuBtn' on:click={() => setStatus(status.LOGIN) }>login</button>
    </div>
	
    <div id='content'>
        {#if current == status.LIST}
            <ListApp logined={logined} username={username} token={token}/>
        {:else if current == status.ADD}
            <AddApp logined={logined} username={username} token={token}/>
        {:else if current == status.LOGIN}
            <LoginApp on:loginProps = { loginProps } />
        {/if}
    </div>
</main>

<style>
    main {
        display : flex;
        align-items: center;
        flex-direction: column;
    }
    #greeting {
        height : 50px;
    }
    #greeting > button { padding : 0px; }
    
    #nav > .menuBtn {
        font-weight : bold;
    }
    #nav > .menuBtn:hover { animation: hover 0.5s forwards; }
    @-webkit-keyframes hover { to { color:#f73c00; } }
    
    span {
        padding: 0 10px;
    }
    #content {
        margin : 50px 100px;
    }
    
    :global(button) {
        border: none;
        background-color: inherit;
        padding: 14px 28px;
        font-size: 16px;
        cursor: pointer;
        border-radius: 5px;
    }
    :global(input) {
        height: 30px;
        border: none;
        border-bottom: 1px solid black;
    }
    :global(input:focus)  { outline: none; }
    
</style>