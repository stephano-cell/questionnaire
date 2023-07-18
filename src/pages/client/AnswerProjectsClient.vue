<template>
  <div>
    <q-card bordered>
      <q-card-section>
        <div class="text-h6">{{ projectName }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col">Total Questions: {{ totalQuestions }}</div>
        <div class="col">Client to Answer: {{ clientToAnswer }}</div>
        <div class="col">Questions for Reviewer: {{ adminToReview }}</div>
        <div class="col">{{ status }}% Completed</div>
      </q-card-section>
    </q-card>
  </div>
  <div>
    <q-splitter v-model="splitterModel" style="height: 800px">
      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            :nodes="groups"
            node-key="label"
            selected-color="primary"
            v-model:selected="selected"
            default-expand-all
          />
        </div>
      </template>

      <template v-slot:after>
        <q-tab-panels
          v-model="selected"
          animated
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel
            v-for="node in flattenedNodes"
            :key="node.label"
            :name="node.label"
          >
            <div class="text-h4 q-mb-md">{{ node.label }}</div>
            <p v-html="node.description"></p>

            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">Client Answer</div>
              <q-editor
                v-model="clientResponse"
                class="q-mb-md"
                :dense="$q.screen.lt.md"
                :toolbar="[
                  ['bold', 'italic', 'strike', 'underline'],

                  [
                    {
                      label: $q.lang.editor.formatting,
                      icon: $q.iconSet.editor.formatting,
                      list: 'no-icons',
                      options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                    },
                    {
                      label: $q.lang.editor.fontSize,
                      icon: $q.iconSet.editor.fontSize,
                      fixedLabel: true,
                      fixedIcon: true,
                      list: 'no-icons',
                      options: [
                        'size-1',
                        'size-2',
                        'size-3',
                        'size-4',
                        'size-5',
                        'size-6',
                        'size-7',
                      ],
                    },
                    {
                      label: $q.lang.editor.defaultFont,
                      icon: $q.iconSet.editor.font,
                      fixedIcon: true,
                      list: 'no-icons',
                      options: [
                        'default_font',
                        'arial',
                        'arial_black',
                        'comic_sans',
                        'courier_new',
                        'impact',
                        'lucida_grande',
                        'times_new_roman',
                        'verdana',
                      ],
                    },
                    'removeFormat',
                  ],
                  [
                    {
                      label: $q.lang.editor.align,
                      icon: $q.iconSet.editor.align,
                      fixedLabel: true,
                      list: 'only-icons',
                      options: ['left', 'center', 'right', 'justify'],
                    },
                    'unordered',
                    'ordered',
                  ],

                  ['undo', 'redo'],
                  ['fullscreen'],
                ]"
                :fonts="{
                  arial: 'Arial',
                  arial_black: 'Arial Black',
                  comic_sans: 'Comic Sans MS',
                  courier_new: 'Courier New',
                  impact: 'Impact',
                  lucida_grande: 'Lucida Grande',
                  times_new_roman: 'Times New Roman',
                  verdana: 'Verdana',
                }"
              />

              <q-select
                v-model="selectedClientResponse"
                :options="currentResponses"
                label="Client"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateClientResponse"
              />

              <div class="text-subtitle2 q-mb-xs">Reviewer Comment</div>
              <br />
              <div v-html="latestReviewerResponse.response"></div>

              <q-select
                v-model="selectedReviewerResponse"
                :options="reviewerResponses"
                label="Reviewer"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateReviewerResponse"
              />
            </div>

            <div class="q-mt-md">
              <q-btn
                label="Submit"
                color="primary"
                @click="submit"
                class="q-mr-md"
              />
              <q-btn label="Next" color="secondary" @click="nextQuestion" />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";

export default {
  setup() {
    const splitterModel = ref(20);
    const selected = ref(null);
    const clientResponse = ref("");

    const reviewerResponse = ref("");

    const clientResponses = ref({});
    const reviewerResponses = ref([
      {
        name: "Reviewer 1",
        date: "2023-05-20",
        response: "Reviewer Comment 1",
        label: "Reviewer 1 - 2023-05-10",
      },
      {
        name: "Reviewer 2",
        date: "2023-05-21",
        response: "Reviewer Comment 2",
        label: "Reviewer 2 - 2023-05-09",
      },
    ]);

    const selectedClientResponse = ref(
      clientResponses.value[clientResponses.value.length - 1]
    );
    const selectedReviewerResponse = ref(
      reviewerResponses.value[reviewerResponses.value.length - 1]
    );

    const groups = ref([
      {
        label: "Group 1",
        children: [
          {
            label: "Question 1",
            description: "Description for Question 1",
          },
          {
            label: "Question 2",
            description: "Description for Question 2",
          },
        ],
      },
      {
        label: "Group 2",
        children: [
          {
            label: "Question 3",
            description: "Description for Question 3",
          },
        ],
      },
    ]);

    const flattenedNodes = computed(() => {
      const nodes = [];
      const traverse = (node) => {
        if (node.children) {
          node.children.forEach(traverse);
        }
        if (node.description) {
          nodes.push(node);
        }
      };
      groups.value.forEach(traverse);
      return nodes;
    });
    const nextQuestion = () => {
      const currentIndex = flattenedNodes.value.findIndex(
        (node) => node.label === selected.value
      );
      const nextIndex = currentIndex + 1;
      if (nextIndex < flattenedNodes.value.length) {
        selected.value = flattenedNodes.value[nextIndex].label;
      }
    };

    const submit = () => {
      const clientNameDate = `Client X - ${
        new Date().toISOString().split("T")[0]
      }`;

      const response = {
        name: "Client X",
        date: new Date().toISOString().split("T")[0],
        response: clientResponse.value,
        label: clientNameDate,
      };

      if (!clientResponses.value[selected.value]) {
        clientResponses.value[selected.value] = [];
      }

      clientResponses.value[selected.value].push(response);

      selectedClientResponse.value = response;
      nextQuestion();
    };

    const updateClientResponse = (selectedObject) => {
      clientResponse.value = selectedObject ? selectedObject.response : "";
    };

    const updateReviewerResponse = (selectedObject) => {
      reviewerResponse.value = selectedObject ? selectedObject.response : "";
    };

    onMounted(() => {
      if (clientResponses.value[selected.value]) {
        const latestResponse =
          clientResponses.value[selected.value][
            clientResponses.value[selected.value].length - 1
          ];
        clientResponse.value = latestResponse.response;
        selectedClientResponse.value = latestResponse;
      }
    });

    watch(clientResponses, (newVal) => {
      if (newVal[selected.value]) {
        selectedClientResponse.value =
          newVal[selected.value][newVal[selected.value].length - 1];
      }
    });
    const currentResponses = computed(() => {
      return clientResponses.value[selected.value] || [];
    });
    watch(selected, (newVal) => {
      if (clientResponses.value[newVal]) {
        const latestResponse =
          clientResponses.value[newVal][
            clientResponses.value[newVal].length - 1
          ];
        clientResponse.value = latestResponse.response;
        selectedClientResponse.value = latestResponse;
      } else {
        clientResponse.value = "";
        selectedClientResponse.value = null;
      }
    });

    const latestReviewerResponse = computed(() => {
      return reviewerResponses.value[reviewerResponses.value.length - 1];
    });
    const projectName = ref("Test 1");
    const totalQuestions = ref(300);
    const clientToAnswer = ref(150);
    const adminToReview = ref(50);
    const status = ref(50); // You can calculate this based on your data

    return {
      splitterModel,
      selected,
      groups,
      flattenedNodes,
      clientResponse,
      reviewerResponse,
      clientResponses,
      reviewerResponses,
      selectedClientResponse,
      selectedReviewerResponse,
      submit,
      nextQuestion,
      updateClientResponse,
      updateReviewerResponse,

      projectName,
      totalQuestions,
      clientToAnswer,
      adminToReview,
      status,
      currentResponses,
      latestReviewerResponse,
    };
  },
};
</script>
