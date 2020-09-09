<template>
  <div class="clone-cards-root">
    <div>
      <span>集合</span>
      <select v-model="currentColl">
        <option v-for="item of collections" :key="item.id" :value="item.id">{{item.name}}</option>
      </select>
      <button @click="fetchCards(currentColl)">获取cards</button>
      <div style="height:300px; width:200px; overflow-y:auto; border:solid 1px black">
        <div v-for="item of cards" :key="item.id">
          <span @click="selectCard(item)">{{selectedCards.has(item)?"[已选择]":"未选择"}}</span>
          <span>{{item.name}}</span>
        </div>
      </div>
    </div>
    <div>
      <select v-model="targetDatabase">
        <option v-for="item of databases" :key="item.id" :value="item.id">{{item.name}}</option>
      </select>
      <div>
        <span>替换（表名，字段名等）：</span>
        <div v-for="(item, index) of replaces" :key="index">
          <input type="text" v-model="item.replaceFrom" />
          <input type="text" v-model="item.replaceTo" />
        </div>
      </div>
      <div>
        <button @click="copyCards(targetDatabase, targetColl)">复制</button>
      </div>
    </div>
    <div>
      <span>目标集合</span>
      <select v-model="targetColl">
        <option v-for="item of targetCollections" :key="item.id" :value="item.id">{{item.name}}</option>
      </select>
      <button @click="fetchCards(targetColl)">获取cards</button>
    </div>
  </div>
</template>
<style>
.clone-cards-root {
  display: grid;
  grid-template-columns: 33.33% 33.33% 33.33%;
}
</style>
<script>
import { ref, watchEffect, watch } from "vue";
export default {
  setup() {
    function useCollections() {
      let collections = ref([]);
      let currentColl = ref("");
      fetch("/metabase/api/collection/root/items")
        .then((resp) => {
          return resp.json();
        })
        .then((resp) => {
          collections.value = resp;
        });
      return { collections, currentColl };
    }

    function useCards() {
      let cards = ref([]);
      let selectedCards = ref(new Set());
      let replaces = [{}, {}, {}, {}];
      function fetchCards(cid) {
        fetch(`/metabase/api/collection/${cid}/items`)
          .then((resp) => {
            return resp.json();
          })
          .then((resp) => {
            cards.value = resp;
          });
      }

      async function copyCards(targetDatabase, targetColl) {
        for (let card of selectedCards.value) {
          await copyCard(card, targetDatabase, targetColl);
        }
      }

      async function copyCard(card, targetDatabase, targetColl) {
        let cardDetail = await getCard(card.id);
        return await createCard(cardDetail, targetDatabase, targetColl);
      }

      async function getCard(cardId) {
        return fetch(`/metabase/api/card/${cardId}`)
          .then((resp) => {
            return resp.json();
          })
          .then((resp) => {
            let { dataset_query } = resp;
            debugger;
            return {
              name: resp.name,
              dataset_query: dataset_query,
              display: "table",
              description: null,
              visualization_settings: {},
              collection_id: 36,
              result_metadata: null,
              metadata_checksum: null,
            };
          });
      }

      async function createCard(cardDetail, targetDatabase, targetCollection) {
        cardDetail.dataset_query.database = targetDatabase;
        cardDetail.collection_id = targetCollection || cardDetail.collection_id;
        if(!cardDetail.collection_id){
          throw new Error('请选择目标集合')
        }
        if (replaces) {
          for (let i = 0; i < replaces.length; i++) {
            const item = replaces[i];
            if (item.replaceFrom) {
              cardDetail.dataset_query.native.query = cardDetail.dataset_query.native.query.replace(
                new RegExp(item.replaceFrom, "g"),
                item.replaceTo
              );
            }
          }
        }
        return fetch(`/metabase/api/card/`, {
          method: "POST",
          body: JSON.stringify(cardDetail),
          headers: {
            "content-type": "application/json",
          },
        });
      }

      function selectCard(item) {
        if (selectedCards.value.has(item)) {
          selectedCards.value.delete(item);
        } else {
          selectedCards.value.add(item);
        }
      }

      return {
        cards,
        selectedCards,
        fetchCards,
        copyCards,
        selectCard,
        replaces,
      };
    }

    function useDatabases() {
      let targetDatabase = ref(null);
      function fetchDatabases() {
        let databases = ref([]);
        fetch(`/metabase/api/database`)
          .then((resp) => {
            return resp.json();
          })
          .then((resp) => {
            databases.value = resp;
          });
        return databases;
      }

      function selectDatabase(database) {
        targetDatabase.value = database;
      }

      const databases = fetchDatabases();

      return { databases, targetDatabase };
    }

    const {
      cards,
      selectedCards,
      fetchCards,
      copyCards,
      selectCard,
      replaces,
    } = useCards();
    let { collections, currentColl } = useCollections();
    let { collections:targetCollections, currentColl:targetColl } = useCollections();
    let { databases, targetDatabase } = useDatabases();
    return {
      collections,
      currentColl,
      targetCollections,
      targetColl,
      cards,
      fetchCards,
      selectedCards,
      copyCards,
      selectCard,
      replaces,
      databases,
      targetDatabase,
    };
  },
};
</script>