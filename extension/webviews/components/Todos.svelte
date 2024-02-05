<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '../types';

  export let user: User;
  export let accessToken: string;
  export let apiBaseUrl: string;

  let text = '';
  let todos: Array<{ text: string; completed: boolean; id: number }> = [];

  const addTodo = async (t: string) => {
    if (!t || t.length === 0) return;
    const response = await fetch(`${apiBaseUrl}/todo`, {
      method: 'POST',
      body: JSON.stringify({
        text: t,
      }),
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });
    const { todo } = await response.json();
    todos = [todo, ...todos];
    text = '';
  };

  onMount(async () => {
    window.addEventListener('message', async (event) => {
      const message = event.data;
      switch (message.type) {
        case 'add-todo':
          addTodo(message.value);
          break;
      }
    });

    const response = await fetch(`${apiBaseUrl}/todo`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await response.json();
    todos = payload.todos;
  });
</script>

<h3>{user.name}</h3>
<br />
<form
  on:submit|preventDefault={() => {
    addTodo(text);
  }}
>
  <input bind:value={text} type="text" placeholder="Add your todo" />
</form>
<br />
<h3>Todos</h3>
<br />
<ul>
  {#each todos as todo (todo.id)}
    <li>
      <span
        class={todo.completed ? 'complete todo' : 'todo'}
        on:click={async () => {
          todo.completed = !todo.completed;
          await fetch(`${apiBaseUrl}/todo/`, {
            method: 'PUT',
            body: JSON.stringify({
              id: todo.id,
            }),
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${accessToken}`,
            },
          });
        }}>{todo.text}</span
      >
      <span
        class="button-delete"
        on:click={async () => {
          todos = todos.filter((t) => t.id !== todo.id);
          const response = await fetch(`${apiBaseUrl}/todo`, {
            method: 'DELETE',
            body: JSON.stringify({
              id: todo.id,
            }),
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          });
        }}>Remove</span
      >
    </li>
  {/each}
</ul>

<style>
  .complete {
    text-decoration: line-through;
    color: pink;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
  }

  .todo {
    cursor: pointer;
  }

  .button-delete {
    color: orangered;
    cursor: pointer;
  }
</style>
