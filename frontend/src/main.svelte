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
	
</script>

<main>
    <div id='greeting'>
	{#if logined}
		{ username } logined!
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
            <ListApp logined={logined} token={token}/>
        {:else if current == status.ADD}
            <AddApp logined={logined} username={username} token={token}/>
        {:else if current == status.LOGIN}
            <LoginApp logined={logined} on:loginProps = { loginProps } />
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
    
    #nav > .menuBtn {
        font-weight : bold;
    }
    #nav > .menuBtn:hover { animation: hoverTextBtnAnim 0.5s forwards; }
    @-webkit-keyframes hoverTextBtnAnim { to { color:#f73c00; } }
    
    #nav > span { padding: 0 10px; }
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
    
    @-webkit-keyframes -global-hoverBtnAnim { to { background-color: #f73c00; color:white; } }
    
</style>