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
              <q-toolbar>
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="table_chart"
                  @click="dialog = true"
                />
              </q-toolbar>
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
              >
              </q-editor>

              <q-dialog v-model="dialog">
                <q-card>
                  <q-card-section>
                    <div class="text-h6">Insert Table</div>
                  </q-card-section>
                  <q-card-section>
                    <q-input
                      filled
                      v-model="tableRows"
                      type="number"
                      label="Rows"
                    />
                    <q-input
                      filled
                      v-model="tableCols"
                      type="number"
                      label="Columns"
                    />
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn flat label="Cancel" color="primary" v-close-popup />
                    <q-btn
                      flat
                      label="Insert"
                      color="primary"
                      @click="insertTable"
                    />
                  </q-card-actions>
                </q-card>
              </q-dialog>

              <q-select
                v-model="selectedClientResponse"
                :options="clientResponses"
                label="Client"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateClientResponse"
              />

              <div class="text-subtitle2 q-mb-xs">Reviewer Comment</div>
              <br />
              <div v-html="reviewerResponse"></div>

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
import { ref, computed, onMounted } from "vue";

export default {
  setup() {
    const dialog = ref(false);
    const tableRows = ref(0);
    const tableCols = ref(0);

    const splitterModel = ref(20);
    const selected = ref(null);
    const clientResponse = ref("");
    const insertTable = () => {
      let table = "<table>";
      for (let i = 0; i < tableRows.value; i++) {
        table += "<tr>";
        for (let j = 0; j < tableCols.value; j++) {
          table += "<td>&nbsp;</td>"; // Add a non-breaking space inside the cell to ensure it has content
        }
        table += "</tr>";
      }
      table += "</table>";
      clientResponse.value += table;
      dialog.value = false;
    };
    const reviewerResponse = ref("");

    const clientResponses = ref([
      {
        name: "Client 1",
        date: "2023-05-18",
        response: "Client Response 1",
        label: "Client 1 - 2023-05-10",
      },
      {
        name: "Client 2",
        date: "2023-05-19",
        response: "Client Response 2",
        label: "Client 2 - 2023-05-08",
      },
    ]);

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

    const submit = () => {
      const clientNameDate = `Client X - ${
        new Date().toISOString().split("T")[0]
      }`;

      clientResponses.value.push({
        name: "Client X",
        date: new Date().toISOString().split("T")[0],
        response: clientResponse.value,
        label: clientNameDate,
      });

      clientResponse.value = "";

      selectedClientResponse.value =
        clientResponses.value[clientResponses.value.length - 1];
    };

    const nextQuestion = () => {
      const currentIndex = flattenedNodes.value.findIndex(
        (node) => node.label === selected.value
      );
      const nextIndex = currentIndex + 1;
      if (nextIndex < flattenedNodes.value.length) {
        selected.value = flattenedNodes.value[nextIndex].label;
      }
    };

    const updateClientResponse = (selectedObject) => {
      clientResponse.value = selectedObject ? selectedObject.response : "";
    };

    const updateReviewerResponse = (selectedObject) => {
      reviewerResponse.value = selectedObject ? selectedObject.response : "";
    };

    onMounted(() => {
      clientResponse.value = selectedClientResponse.value.response;
      reviewerResponse.value = selectedReviewerResponse.value.response;
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
      insertTable,
      dialog, // add this
      tableRows, // add this
      tableCols, // add this
      toolbar, // add this
    };
  },
};
</script>
<style scoped>
/deep/ .q-editor__content table {
  border-collapse: collapse;
  width: 100%;
}

/deep/ .q-editor__content table td {
  border: 1px solid black;
  padding: 10px;
}
</style>

*/ :toolbar="[ ['bold', 'italic', 'strike', 'underline'], [ { label:
$q.lang.editor.formatting, icon: $q.iconSet.editor.formatting, list: 'no-icons',
options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], }, { label:
$q.lang.editor.fontSize, icon: $q.iconSet.editor.fontSize, fixedLabel: true,
fixedIcon: true, list: 'no-icons', options: [ 'size-1', 'size-2', 'size-3',
'size-4', 'size-5', 'size-6', 'size-7', ], }, { label:
$q.lang.editor.defaultFont, icon: $q.iconSet.editor.font, fixedIcon: true, list:
'no-icons', options: [ 'default_font', 'arial', 'arial_black', 'comic_sans',
'courier_new', 'impact', 'lucida_grande', 'times_new_roman', 'verdana', ], },
'removeFormat', ], [ { label: $q.lang.editor.align, icon:
$q.iconSet.editor.align, fixedLabel: true, list: 'only-icons', options: ['left',
'center', 'right', 'justify'], }, 'unordered', 'ordered', ], ['undo', 'redo'],
['fullscreen'], ]" :fonts="{ arial: 'Arial', arial_black: 'Arial Black',
comic_sans: 'Comic Sans MS', courier_new: 'Courier New', impact: 'Impact',
lucida_grande: 'Lucida Grande', times_new_roman: 'Times New Roman', verdana:
'Verdana', }" :toolbar="[ ['bold', 'italic', 'strike', 'underline'], [ { label:
$q.lang.editor.fontSize, icon: $q.iconSet.editor.fontSize, fixedLabel: true,
fixedIcon: true, list: 'no-icons', options: [ 'size-1', 'size-2', 'size-3',
'size-4', 'size-5', 'size-6', 'size-7', ], }, ], [ { label:
$q.lang.editor.align, icon: $q.iconSet.editor.align, fixedLabel: true, list:
'only-icons', options: ['left', 'center', 'right', 'justify'], }, 'unordered',
'ordered', ], ['undo', 'redo'], ['fullscreen'], ]"
