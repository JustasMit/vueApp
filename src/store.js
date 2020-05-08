import Vue from "vue";
import Vuex from "vuex";
import db from "./firebase";

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    loading: true,
    loadingElse: false,
    filter: "all",
    todos: []
  },
  getters: {
    remaining(state) {
      return state.todos.filter(todo => !todo.completed).length;
    },
    todosFiltered(state) {
      switch (state.filter) {
        case "all":
          return state.todos;
        case "active":
          return state.todos.filter(todo => !todo.completed);
        case "completed":
          return state.todos.filter(todo => todo.completed);
      }
      return state.todos;
    },
    enableClearButton(state) {
      return state.todos.filter(todo => todo.completed).length > 0;
    }
  },
  mutations: {
    addTodo(state, todo) {
      state.todos.push({
        id: todo.id,
        title: todo.title,
        completed: false,
        editing: false
      });
    },
    clearCompleted(state) {
      state.todos = state.todos.filter(todo => !todo.completed);
    },
    filterChange(state, filter) {
      state.filter = filter;
    },
    checkAll(state, checked) {
      state.todos.forEach(todo => (todo.completed = checked));
    },
    removeTodo(state, id) {
      const index = state.todos.findIndex(item => item.id == id);
      state.todos.splice(index, 1);
    },
    doneTodo(state, todo) {
      const index = state.todos.findIndex(item => item.id == todo.id);
      state.todos.splice(index, 1, {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        editing: todo.editing
      });
    },
    retrieveTodos(state, todos) {
      state.todos = todos;
    }
  },
  actions: {
    addTodo(context, todo) {
      context.state.loadingElse = true;
      db.collection("todos")
        .add({
          title: todo.title,
          completed: false,
          timestamp: new Date()
        })
        .then(doc => {
          context.state.loadingElse = false;
          context.commit("addTodo", {
            id: doc.id,
            title: todo.title,
            completed: false
          });
        });
    },
    clearCompleted(context) {
      context.state.loadingElse = true;
      db.collection("todos")
        .where("completed", "==", true)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            doc.ref.delete().then(() => {
              context.state.loadingElse = false;
              context.commit("clearCompleted");
            });
          });
        });
    },
    filterChange(context, filter) {
      context.commit("filterChange", filter);
    },
    checkAll(context, checked) {
      context.state.loadingElse = true;
      db.collection("todos")
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            doc.ref
              .update({
                completed: checked
              })
              .then(() => {
                context.state.loadingElse = false;
                context.commit("checkAll", checked);
              });
          });
        });
    },
    removeTodo(context, id) {
      context.state.loadingElse = true;
      db.collection("todos")
        .doc(id)
        .delete()
        .then(() => {
          context.state.loadingElse = false;
          context.commit("removeTodo", id);
        });
    },
    doneTodo(context, todo) {
      context.state.loadingElse = true;
      db.collection("todos")
        .doc(todo.id)
        .set({
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          timestamp: new Date()
        })
        .then(() => {
          context.state.loadingElse = false;
          context.commit("doneTodo", todo);
        });
    },
    retrieveTodos(context) {
      context.state.loading = true;
      db.collection("todos")
        .get()
        .then(querySnapshot => {
          let tempTodos = [];
          querySnapshot.forEach(doc => {
            const data = {
              id: doc.id,
              title: doc.data().title,
              completed: doc.data().completed,
              timestamp: doc.data().timestamp
            };
            tempTodos.push(data);
          });
          context.state.loading = false;
          const tempTodosSorted = tempTodos.sort((a, b) => {
            return a.timestamp.seconds - b.timestamp.seconds;
          });
          context.commit("retrieveTodos", tempTodosSorted);
        });
    }
  }
});
