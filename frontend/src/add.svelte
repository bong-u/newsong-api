<script>
	export let logined = false;
	export let username = '';
	export let token = '';
	let searchResult = [];
	
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
		
		fetch('http://newsongg.run.goorm.io/item', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization' : 'Bearer '+ token
			},
			body : JSON.stringify(payload)
		})
		.then( resp => { return resp.json(); })
		.then( resp => {
			alert (resp.name + ' added successfully');
		})
		.catch(error => {
			console.error(error);
		});
	}
		
</script>

<main>
	{#if logined}
		
		<form id="searchForm" on:submit|preventDefault={ search }>
			<input id="query" type="text"/>
			<button>search</button>
		</form>
		
		<div class="itemView">
			{#each searchResult as item}
				<div class="item" id={ item.id } name={ item.name } image={ item.imgList[3].url }>
					<img src={ item.imgList[3].url } alt="" on:click={ addItem }/>
					<div class='itemName'> { item.name } </div>
				</div>
			{/each}
		</div>
    {:else}
        <div>Login required.</div>
	{/if}
</main>

<style>
    #searchForm {
        text-align: center;
    }
    #searchForm > button {
        margin: 20px;
    }
    
   #searchForm > button:hover { animation: colortocdd 0.5s forwards; }
    @-webkit-keyframes colortocdd { to {background-color: #cddc39; } }
</style>