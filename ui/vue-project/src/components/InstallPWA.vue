<script setup lang="ts">
import { ref, onMounted } from "vue";
const deferredPrompt = ref<any>(null);

function installPWA() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();

    deferredPrompt.value.userChoice.then((choiceResult: any)=>{
      if (choiceResult.outcome == "accepted") {
        console.log('App installed');
      } else {
        console.log('App installation declined');
      }

      deferredPrompt.value = null;
    })
  }
}
onMounted(()=>{
  window.addEventListener("beforeinstallprompt", (event)=>{
    event.preventDefault();
    deferredPrompt.value = event;
  })

})
</script>
<template>
   <button></button>
</template>