import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import router from "./routes";

import Toast from "vue-toastification";
// Import the CSS or use your own!
import "vue-toastification/dist/index.css";
import "vue-select/dist/vue-select.css";

import Select from "vue-select";

const app = createApp(App);

app.component("Select", Select);
app.use(Toast, {});
app.use(router);

app.mount("#app");
