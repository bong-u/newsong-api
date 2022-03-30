<script>
	export let logined = false;
	export let username = '';
	export let token = '';
	
	$ : items = fetch('http://bongg.run.goorm.io/item')
	.then( resp => { return resp.json(); })
	.then( resp => { return resp; })
	.catch(error => {
		console.error(error)
		return [];
	});
	
	function deleteItem(event) {
		let flag = confirm ('Are you sure to delete this item?');
		
		if (!flag) return;
		
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
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization' : 'Bearer '+ token
			},
			body : JSON.stringify(payload)
		})
		.then( resp => { return resp.json(); })
		.then( resp => {
			alert (resp.name + ' removed successfully');
		})
		.catch(error => {
			console.error(error);
		});
		
	}
	
</script>

<main>
    <h1>REST</h1>
	
	{#await items}
    	<p>...Loading</p>
		
	{:then items } 
    	<div class="itemView">
			{#each items as item, index}
				<div class="item" id={ item.id } name={ item.name } image={ item.image }>
					<img src={ item.image } alt="" on:click={ deleteItem }/>
					<div class='itemName'> { item.name } </div>
				</div>
			{/each}
    	</div>
		
  	{:catch error}
    	<p>오류가 발생했습니다.</p>
  	{/await}
	
</main>

<style>
    main {
        text-align: center;
        padding: 1em;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        font-size: 4em;
        font-weight: 100;
    }
</style>