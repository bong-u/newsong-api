<script>
	let logined = false;
	let token = '';
	let username = '';
	
	function loginProc() {
		let formData = new FormData(document.getElementById('loginForm'));
		
		fetch('http://bongg.run.goorm.io/login', {
			method: 'POST',
			body : formData,
		})
		.then( resp => {
			return resp.json();
		})
		.then( data => {
			if (! data.access_token) {		//login failed
				alert (data.detail);
				return;
			}
			
			logined = true;
			token = data.access_token;
			username = formData.get('username');
			return;
		})
		.catch(error => {
			console.log (error)
			console.error(error)
			return;
		});
	}
	
	function search() {
		console.log(document.getElementById('query').value)
	
		fetch('https://www.music-flo.com/api/search/v2/search?keyword='+query+'&searchType=ARTIST&sortType=ACCURACY&size=10&page=1')
		.then( resp => {
			return resp.json();
		})
		.then( data => {
		})
		.catch(error => {
		});
	}
		
</script>

<main>
	<form id="loginForm" on:submit|preventDefault={ loginProc }>
	
		<input type="text" name="username"/>
		<input type="password" name="password"/>
		
		<button>login</button>
	</form>
	
	{#if logined||true}
		{ username } logined.
		<form id="searchForm" on:submit|preventDefault={ search }>
			<input id="query" type="text"/>
			<button>search</button>
		</form>
		
		<div id="searchArea">
		</div>
	{/if}
</main>

<style>
</style>