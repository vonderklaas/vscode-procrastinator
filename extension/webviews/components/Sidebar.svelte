<script lang="ts">
  import { onMount } from 'svelte';
  import Todos from './Todos.svelte';
  import type { User } from '../types';

  let accessToken = '';
  let loading = true;
  let user: User | null = null;

  onMount(async () => {
    window.addEventListener('message', async (event) => {
      const message = event.data;
      switch (message.type) {
        case 'authenticate':
          tsvscode.postMessage({ type: 'authenticate', value: undefined });
          break;
        case 'token':
          accessToken = message.value;

          const response = await fetch(`${apiBaseUrl}/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          user = data.user;
          loading = false;
          break;
      }
    });

    tsvscode.postMessage({ type: 'get-token', value: undefined });
  });
</script>

<div>
  {#if loading}
    <div>Loading...</div>
  {:else if user}
    <br />
    <Todos {accessToken} {user} {apiBaseUrl} />
    <br />
    <button
      on:click={() => {
        accessToken = '';
        user = null;
        tsvscode.postMessage({ type: 'logout', value: undefined });
      }}>Log out</button
    >
  {:else}
    <br />
    <div>No user</div>
    <br />
    <button
      on:click={() => {
        tsvscode.postMessage({ type: 'authenticate', value: undefined });
      }}>Log In GitHub</button
    >
  {/if}
</div>
