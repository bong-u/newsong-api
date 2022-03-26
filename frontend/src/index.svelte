<script>
	
	$ : items = fetch('http://bongg.run.goorm.io/item')
	.then( resp => {
		return resp.json();
	})
	.then( data => {
		console.log(JSON.stringify(data));
		return data;
	})
	.catch(error => {
		console.error(error)
		return [];
	});
	
</script>

<main>
    <h1>REST</h1>
	
	{#await items}
    	<p>...Loading</p>
		
	{:then items } 
    	<ul>
      	{#each items as item, index}
        	<li>
          		<p>[{item.id}] {item.name}</p>
       		</li>
		{/each}
    	</ul>    
		
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