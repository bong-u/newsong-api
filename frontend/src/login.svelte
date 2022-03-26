<script>
	let user_id = '';
	let pw = '';
	
	function loginProc() {
		console.log(user_id);
		
	}
</script>

<main>
	<form on:submit|preventDefault={ loginProc }>
	
		<input type="text" name="id" bind:value={user_id}/>
		<input type="password" name="password" bind:value={pw}/>
		
		<button>login</button>
	</form>
</main>

<style>
</style>