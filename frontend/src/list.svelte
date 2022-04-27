<script>
	export let logined = false;
	export let token = '';
	
	$ : items = fetch('http://newsongg.run.goorm.io/item')
	.then( resp => { return resp.json(); })
	.then( resp => { return resp; })
	.catch(error => {
		console.error(error)
		return [];
	});
	
	function deleteItem(event) {
        if (!logined) {
            alert ('login required to delete');
            return;
        }
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
		
		fetch('http://newsongg.run.goorm.io/item', {
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
	
	{#await items}
    	<p>...Loading</p>
		
	{:then items } 
    	<div class="itemView">
			{#each items as item, index}
				<div class="item" id={ item.id } name={ item.name } image={ item.image }>
					<img src={ item.image } alt="" on:click={ deleteItem }/>
					<div class='itemName'> { item.name.replace(/ \([\s\S]*?\)/g, '') } </div>
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
    
	:global(.itemView) {
		display : flex;
		gap: 50px;
		flex-wrap: wrap;
		flex-direction: row;
	}
    
	:global(.itemView > .item > img) {
        cursor : pointer;
		object-fit: cover;
        width : 100px;
        height: 100px;
	}
    :global(.itemView > .item > img:hover) { animation: flash 1.5s; }
    @-webkit-keyframes -global-flash {
        0% { opacity: .4; }
	    100% { opacity: 1; }
    }
    
	:global(.itemView > .item > .itemName) {
        font-size : 12px;
		width : 100px;
		text-align : center;   
	}
</style>