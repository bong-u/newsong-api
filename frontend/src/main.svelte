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
	{#if logined}
		{ username } logined!
		<button id="logoutBtn" on:click= { logout } >logout</button>
		<br/>
	{/if}
	<button on:click={() => setStatus(status.LIST) }>main</button>
	<button on:click={() => setStatus(status.ADD) }>add</button>
	<button on:click={() => setStatus(status.LOGIN) }>login</button>
	
	{#if current == status.LIST}
		<ListApp logined={logined} username={username} token={token}/>
	{:else if current == status.ADD}
		<AddApp logined={logined} username={username} token={token}/>
	{:else if current == status.LOGIN}
		<LoginApp on:loginProps = { loginProps } />
	{/if}
</main>

<style>
	:global(.itemView) {
		display : flex;
		gap: 50px;
		flex-wrap: wrap;
		flex-direction: row;
	}
	:global(.itemView > .item > img) {
		object-fit: cover;
		width : 100px;	
    	height: 100px;
	}
	:global(.itemView > .item > .itemName) {
		width : 100px;
		text-align : center;
	}
</style>