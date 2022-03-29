<script>
	let logined = false;
	let token = '';
	let username = '';
	let searchResult = [];
	
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
	
	function search() {
		const query = document.getElementById('query').value;
	
		fetch('https://www.music-flo.com/api/search/v2/search?keyword='+query+'&searchType=ARTIST&sortType=ACCURACY&size=10&page=1')
		.then( resp => { return resp.json(); })
		.then( resp => {
			if (Object.keys(resp.data).length == 0 ) {
				alert (resp.message);
				return;
			}
			searchResult = resp.data.list[0].list;
		})
		.catch(error => {
			console.error(error);
		});
	}
	
	function addItem (event) {
		const id = event.target.parentElement.getAttribute('id');
		const name = event.target.parentElement.getAttribute('name');
		const image = event.target.parentElement.getAttribute('image');
		
		
		const payload = {
			'id': Number(id),
			'name': name,
			'recent' : 0,
			'image': image,
        }
		
		fetch('http://bongg.run.goorm.io/item', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Authorization' : 'Bearer '+ token
			},
			body : JSON.stringify(payload)
		})
		.then( resp => { return resp.json(); })
		.then( resp => {
			console.log (resp);
		})
		.catch(error => {
			console.error(error);
		});
	}
		
</script>

<main>
	<form id="loginForm" on:submit|preventDefault={ loginProc }>
	
		<input type="text" name="username"/>
		<input type="password" name="password"/>
		
		<button id="loginBtn">login</button>
	</form>
	
	{#if logined||true}
		{ username } logined.
		<button id="logoutBtn">logout</button>
		
		<form id="searchForm" on:submit|preventDefault={ search }>
			<input id="query" type="text"/>
			<button>search</button>
		</form>
		
		<div id="searchResult">
			{#each searchResult as item}
				<div class="item" id={ item.id } name={ item.name } image={ item.imgList[3].url }>
					<img src={ item.imgList[3].url } alt="" on:click={ addItem }/>
					<div class='itemName'> { item.name } </div>
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	#searchResult {
		display : flex;
		gap: 50px;
		flex-wrap: wrap;
		flex-direction: row;
	}
	#searchResult > .item > img {
		object-fit: cover;
		width : 100px;	
    	height: 100px;
	}
	#searchResult > .item > .itemName {
		width : 100px;
		text-align : center;
	}
</style>