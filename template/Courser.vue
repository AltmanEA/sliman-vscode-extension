<script setup lang="ts">
import { onMounted, ref } from "vue";

type Slide = { name: string; title: string; };
type Slides = { slides: Slide[]; };

type Link = { text: string; url: string };

const isMenu = ref(false)

const title = ref("");
onMounted(() => {
  title.value = document.title.replace(/ - Slidev$/, "");
});
const linksArray = ref<Link[]>([]);
onMounted(async () => {
  const response = await fetch("../slides.json");
  const slide_list_json = await response.text();
  const slide_list = JSON.parse(slide_list_json) as Slides;
  console.log(response);
  const links = slide_list.slides.map(slide => {
      return { text: slide.title, url: `../${slide.name}` };
  });
  linksArray.value = links;
});

const toggleMenu = () => isMenu.value = !isMenu.value;
</script>

<style scoped>
.courser {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 60%;
  padding: 5px;
  line-height: 1.4em;
}
.inline {
  display: inline;
}
</style>

<template>
  <div class="courser" @click="toggleMenu" v-if="!isMenu">{{ title }}</div>
  <div class="courser" v-if="isMenu">
    <div>
      <a class="inline" href="../index.html">🏠</a>
      <span class="inline">&nbsp;&nbsp;&nbsp;</span>
      <a class="inline" href="#" @click="toggleMenu">✕</a>
    </div>
    <ul>
      <li v-for="(link, index) in linksArray" :key="index"><a :href="link.url">{{ link.text }}</a></li>
    </ul>
  </div>
</template>