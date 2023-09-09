<template>
  <div>
    <q-card bordered>
      <q-card-section>
        <div class="text-h6">{{ projectName }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="row items-center q-col-gutter-md justify-between">
        <div class="row items-center">
          <q-input
            outlined
            v-model="search"
            label="Search"
            class="col-5 q-mr-md"
          />
          <q-btn-dropdown ref="dropdown" label="Filter" class="col-auto">
            <q-list style="width: 200px">
              <q-item
                clickable
                v-for="filter in filters"
                :key="filter.value"
                @click="applyFilter(filter.value)"
              >
                <q-item-section>{{ filter.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div class="col">Total Questions: {{ totalQuestions }}</div>
        <div class="col">Client to Answer: {{ clientToAnswer }}</div>
        <div class="col">Questions for Reviewer: {{ ReviewerToRespond }}</div>
        <div class="col">{{ status }}% Completed</div>
      </q-card-section>
    </q-card>
  </div>

  <div>
    <q-splitter v-model="splitterModel" style="height: 800px">
      <template v-slot:before>
        <div class="q-pa-md">
          <q-tree
            v-if="filteredGroups.length"
            :nodes="
              filteredGroups.map((group) => ({
                ...group,
                label: `${group.label} (${group.children.length})`,
              }))
            "
            node-key="id"
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
          @wheel="handleArrowKeys"
        >
          <q-tab-panel
            v-for="node in flattenedNodes"
            :key="node.id"
            :name="node.id"
          >
            <div style="margin-bottom: 20px">
              <div
                style="border: 1px solid #1976d2; padding: 0px; max-width: 60%"
              >
                <div style="background-color: #1976d2; color: #fff">
                  <h6 style="margin: 0; padding: 10px 10px 10px 10px">
                    {{ node.label }}
                  </h6>
                </div>
                <p
                  style="margin-top: 10px; padding-left: 10px"
                  v-html="node.description"
                  class="description-content"
                ></p>
              </div>
            </div>
            <br />
            <div
              v-if="selectedClientAnswer"
              v-html="selectedClientAnswer.value"
              class="description-content"
            ></div>

            <q-select
              v-model="selectedClientAnswer"
              :options="selectedQuestionAnswers"
              label="Client"
              style="width: 200px"
              class="q-mb-md"
              @update:model-value="updateClientAnswer"
            />
            <hr />
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">Reviewer Comment</div>

              <q-btn
                flat
                round
                dense
                size="sm"
                icon="grid_on"
                @click="dialog = true"
              />
              <q-editor
                v-model="reviewerComment"
                class="q-mb-md"
                :dense="$q.screen.lt.md"
                :toolbar="toolbarConfig"
                :fonts="fontsConfig"
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
                v-model="selectedReviewerComment"
                :options="reviewerCommentsOptions"
                label="Reviewer"
                style="width: 200px"
                class="q-mb-md"
                @update:model-value="updateReviewerComment"
              />
            </div>

            <div class="q-mt-md">
              <div class="q-mb-md">
                <q-btn
                  label="Submit"
                  color="primary"
                  @click="submit"
                  class="q-mr-md"
                />
                <q-checkbox
                  v-model="isCompleted"
                  color="secondary"
                  label="Complete"
                  class="text-bold"
                />
                <q-checkbox
                  v-model="isLocked"
                  color="primary"
                  label="Lock"
                  class="text-bold q-mr-md"
                />
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import {
  ref,
  computed,
  nextTick,
  onMounted,
  watch,
  onBeforeUnmount,
} from "vue";
import { useAppStore } from "../../stores/appStore";
import { useRouter } from "vue-router";
import { toolbarConfig, fontsConfig } from "../../components/editorConfig";

export default {
  props: {
    id: {
      type: String, // or Number, depending on what type your id is
      required: true,
    },
  },

  setup(props, context) {
    const splitterModel = ref(15);
    const selected = ref(null);
    const currentFilter = ref(null);
    const dialog = ref(false);
    const tableRows = ref(0);
    const tableCols = ref(0);
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
      reviewerComment.value += table;
      dialog.value = false;
    };
    const handleArrowKeys = (event) => {
      // Arrow up key
      if (event.keyCode === 38) {
        prevQuestion();
      }
      // Arrow down key
      else if (event.keyCode === 40) {
        nextQuestion();
      }
    };
    const prevQuestion = () => {
      const currentIndex = filteredFlattenedNodes.value.findIndex(
        (node) => node.id === selected.value
      );
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        selected.value = filteredFlattenedNodes.value[prevIndex].id;
      }
    };

    const dropdown = ref(null);
    const applyFilter = (filter) => {
      currentFilter.value = filter;
      dropdown.value.hide();
    };
    const search = ref("");
    const filteredQuestions = computed(() => {
      return flattenedNodes.value.filter(
        (node) =>
          node.label.toLowerCase().includes(search.value.toLowerCase()) ||
          node.description.toLowerCase().includes(search.value.toLowerCase())
      );
    });

    const selectedQuestion = computed(() => {
      return flattenedNodes.value.find((node) => node.id === selected.value);
    });

    const reviewerComment = ref("");

    const authDataString = localStorage.getItem("auth");
    const jsonString = authDataString.replace("__q_objt|", ""); // Remove the Quasar prefix
    const authData = JSON.parse(jsonString);
    const userId = authData.id;
    const resetSearch = () => {
      fetchProjectSelectedQuestions();
    };
    const reviewerComments = ref([]);

    const selectedReviewerComment = ref({ label: "", value: { label: "" } });
    const selectedQuestionAnswers = computed(() => {
      return questionToClientAnswers.value[selected.value] || [];
    });
    const questionToClientAnswers = computed(() => {
      const mapping = {};
      flattenedNodes.value.forEach((node) => {
        const projectQuestionId = node.id;
        const answers = clientAnswers.value.filter(
          (answer) => answer.projectQuestionId === projectQuestionId
        );
        mapping[node.id] = answers || [];
      });
      return mapping;
    });
    const questionToReviewerComments = computed(() => {
      const mapping = {};
      flattenedNodes.value.forEach((node) => {
        const projectQuestionId = node.id;
        const comments = reviewerComments.value.filter(
          (comment) => comment.projectQuestionId === projectQuestionId
        );
        mapping[node.id] = comments || [];
      });
      return mapping;
    });

    const clientAnswer = ref("");
    const isLocked = ref(false);
    const isCompleted = ref(false);

    const clientAnswers = ref([]);
    const selectedClientAnswer = ref({});

    const groups = ref([]);
    const store = useAppStore();
    const router = useRouter();
    const projectId = ref(props.id);

    const fetchProjectSelectedQuestions = async () => {
      if (projectId.value) {
        const projectTickedQuestions =
          await store.fetchProjectSelectedQuestions(projectId.value);

        // Convert the fetched data to the format q-tree expects
        const groupsMap = new Map();
        let completedQuestions = 0;
        projectTickedQuestions.forEach((question) => {
          if (!groupsMap.has(question.groupId)) {
            groupsMap.set(question.groupId, {
              label: question.groupName,
              children: [],
              selectable: false, // Parent nodes are not selectable
            });
          }
          const group = groupsMap.get(question.groupId);

          group.children.push({
            label: question.questionTitle,
            description: question.questionDescription,
            id: question.projectQuestionId,
            isLocked: Boolean(question.isLocked), // Convert to boolean
            isCompleted: Boolean(question.isCompleted), // Convert to boolean
            selectable: true, // Child nodes are selectable
          });

          // If the question is completed, increment the completedQuestions counter
          if (question.isCompleted) {
            completedQuestions++;
          }
        });

        // Calculate the percentage of completed questions
        const totalQuestions = projectTickedQuestions.length;
        const completionPercentage = (
          (completedQuestions / totalQuestions) *
          100
        ).toFixed(2);

        // Set the status value
        status.value = completionPercentage;

        groups.value = Array.from(groupsMap.values());
      }
    };

    const fetchProjectDetails = async () => {
      if (projectId.value) {
        store.fetchProject(projectId.value).then((project) => {
          projectName.value = project.name;
        });
      }
    };

    fetchProjectSelectedQuestions();
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
      const currentIndex = filteredFlattenedNodes.value.findIndex(
        (node) => node.id === selected.value
      );
      const nextIndex = currentIndex + 1;
      if (nextIndex < filteredFlattenedNodes.value.length) {
        selected.value = filteredFlattenedNodes.value[nextIndex].id;
      }
    };
    const submit = () => {
      console.log("Selected question ID:", selected.value);
      const selectedQuestion = flattenedNodes.value.find(
        (node) => node.id === selected.value // use id to find selected question
      );
      const commentData = {
        comment: reviewerComment.value,
        projectQuestionId: selectedQuestion.id, // Use the id from projectsQuestions
        userId: userId, // Use the actual user ID
      };

      store
        .submitComment(commentData)
        .then((result) => {
          console.log("Comment submitted with ID:", result.id);

          // Fetch the latest reviewer comments from the server
          store
            .fetchProjectReviewerComments(projectId.value)
            .then((comments) => {
              reviewerComments.value = comments;
            });

          nextQuestion();
        })
        .catch((error) => {
          console.error("Error submitting comment:", error);
        });
    };

    const updateReviewerComment = (newVal) => {
      selectedReviewerComment.value = newVal;
      reviewerComment.value = newVal.value; //
    };

    const updateClientAnswer = (selectedObject) => {
      selectedClientAnswer.value = selectedObject;
      clientAnswer.value = selectedObject ? selectedObject.value : "";
    };
    const filters = [
      { label: "Show All", value: "all" },
      { label: "Completed", value: "completed" },
      { label: "Not Completed", value: "notCompleted" },
      { label: "Reviewer To Respond", value: "reviewerToRespond" },
      { label: "Client To Answer", value: "clientToAnswer" },
    ];
    const filteredGroups = computed(() => {
      let filtered = groups.value
        .map((group) => {
          const filteredChildren = group.children.filter(
            (child) =>
              child.label.toLowerCase().includes(search.value.toLowerCase()) ||
              child.description
                .toLowerCase()
                .includes(search.value.toLowerCase())
          );
          return { ...group, children: filteredChildren };
        })
        .filter((group) => group.children.length > 0)
        .map((group, index) => {
          return { id: index, ...group };
        });

      switch (currentFilter.value) {
        case "completed":
          filtered = filtered
            .map((group) => {
              // Filter out the children that are completed
              const completedChildren = group.children.filter(
                (child) => child.isCompleted
              );
              return { ...group, children: completedChildren };
            })
            .filter((group) => group.children.length > 0); // Remove groups that have no children left after filtering
          break;
        case "notCompleted":
          filtered = filtered
            .map((group) => {
              // Filter out the children that are not completed
              const notCompletedChildren = group.children.filter(
                (child) => !child.isCompleted
              );
              return { ...group, children: notCompletedChildren };
            })
            .filter((group) => group.children.length > 0); // Remove groups that have no children left after filtering
          break;
        case "reviewerToRespond":
          filtered = filtered
            .map((group) => {
              // Filter out the children that require reviewer response
              const reviewerToRespondChildren = group.children.filter(
                (node) => {
                  const selectedQuestionAnswers =
                    questionToClientAnswers.value[node.id];
                  const selectedQuestionComments =
                    questionToReviewerComments.value[node.id];

                  const latestAnswer =
                    selectedQuestionAnswers &&
                    selectedQuestionAnswers.length > 0
                      ? selectedQuestionAnswers[
                          selectedQuestionAnswers.length - 1
                        ]
                      : null;
                  const latestResponse =
                    selectedQuestionComments &&
                    selectedQuestionComments.length > 0
                      ? selectedQuestionComments[
                          selectedQuestionComments.length - 1
                        ]
                      : null;

                  return (
                    latestAnswer &&
                    (!latestResponse ||
                      new Date(latestAnswer.timestamp) >
                        new Date(latestResponse.timestamp)) &&
                    node.isCompleted != 1
                  );
                }
              );

              return { ...group, children: reviewerToRespondChildren };
            })
            .filter((group) => group.children.length > 0); // Remove groups that have no children left after filtering
          break;

        case "clientToAnswer":
          filtered = filtered
            .map((group) => {
              // Filter out the children that require client answer
              const clientToAnswerChildren = group.children.filter((node) => {
                const selectedQuestionAnswers =
                  questionToClientAnswers.value[node.id];
                const selectedQuestionComments =
                  questionToReviewerComments.value[node.id];

                const latestAnswer =
                  selectedQuestionAnswers && selectedQuestionAnswers.length > 0
                    ? selectedQuestionAnswers[
                        selectedQuestionAnswers.length - 1
                      ]
                    : null;
                const latestResponse =
                  selectedQuestionComments &&
                  selectedQuestionComments.length > 0
                    ? selectedQuestionComments[
                        selectedQuestionComments.length - 1
                      ]
                    : null;

                return (
                  (latestAnswer === null ||
                    (latestAnswer &&
                      latestResponse &&
                      new Date(latestAnswer.timestamp) <
                        new Date(latestResponse.timestamp))) &&
                  node.isCompleted != 1
                );
              });

              return { ...group, children: clientToAnswerChildren };
            })
            .filter((group) => group.children.length > 0); // Remove groups that have no children left after filtering
          break;

        default: // Show all
          break;
      }

      return filtered;
    });

    const filteredFlattenedNodes = computed(() => {
      const nodes = [];
      const traverse = (node) => {
        if (node.children) {
          node.children.forEach(traverse);
        }
        if (node.description) {
          nodes.push(node);
        }
      };
      filteredGroups.value.forEach(traverse);
      return nodes;
    });

    watch(
      () => router.currentRoute.value,
      async (newRoute) => {
        projectId.value = newRoute.params.id;
        await resetSearch();
      }
    );
    watch(
      () => router.currentRoute.value,
      async (newRoute) => {
        projectId.value = newRoute.params.id;
        await fetchProjectSelectedQuestions();
      }
    );

    watch(selected, async (newVal) => {
      const selectedQuestion = flattenedNodes.value.find(
        (node) => node.id === newVal
      );
      await fetchProjectSelectedQuestions();
      if (selectedQuestion) {
        isLocked.value = selectedQuestion.isLocked;
        isCompleted.value = selectedQuestion.isCompleted;
      }
      const selectedQuestionComments = questionToReviewerComments.value[newVal];
      if (selectedQuestionComments && selectedQuestionComments.length > 0) {
        const latestResponse =
          selectedQuestionComments[selectedQuestionComments.length - 1];
        reviewerComment.value = latestResponse.comment;

        selectedReviewerComment.value = {
          label: `${latestResponse.userEmail} - ${new Date(
            latestResponse.timestamp
          ).toLocaleString()}`,
          value: latestResponse.comment,
        };
      } else {
        reviewerComment.value = "";
        selectedReviewerComment.value = { label: "", value: "" };
      }
      const selectedQuestionAnswers = questionToClientAnswers.value[newVal];
      if (selectedQuestionAnswers && selectedQuestionAnswers.length > 0) {
        const latestAnswer =
          selectedQuestionAnswers[selectedQuestionAnswers.length - 1];

        selectedClientAnswer.value = {
          label: latestAnswer.label,
          value: latestAnswer.value,
        };
      } else {
        selectedClientAnswer.value = { label: "", value: "" };
      }
      console.log(
        "updated selectedClientAnswer.value:",
        selectedClientAnswer.value
      );
    });
    watch(isLocked, async (newIsLocked) => {
      if (selectedQuestion.value) {
        store.lockQuestion(selectedQuestion.value.id, newIsLocked);
        await fetchProjectSelectedQuestions();
      }
      await fetchProjectSelectedQuestions();
    });

    watch(isCompleted, async (newIsComplete) => {
      if (selectedQuestion.value) {
        store.completeQuestion(selectedQuestion.value.id, newIsComplete);
        await fetchProjectSelectedQuestions();
      }
      await fetchProjectSelectedQuestions();
    });
    const reviewerCommentsOptions = computed(() => {
      if (!selected.value) {
        return [];
      }

      const selectedQuestionComments =
        questionToReviewerComments.value[selected.value];
      return selectedQuestionComments.map((comment) => ({
        label: `${comment.userEmail} - ${new Date(
          comment.timestamp
        ).toLocaleString()}`,
        value: comment.comment,
      }));
    });
    onMounted(async () => {
      try {
        await nextTick();
        fetchProjectDetails();
        fetchProjectSelectedQuestions();
        store.fetchProjectReviewerComments(projectId.value).then((comments) => {
          reviewerComments.value = comments;

          if (flattenedNodes.value.length > 0) {
            selected.value = flattenedNodes.value[0].label;

            const selectedQuestionComments =
              questionToReviewerComments.value[selected.value];
            if (
              selectedQuestionComments &&
              selectedQuestionComments.length > 0
            ) {
              const latestResponse =
                selectedQuestionComments[selectedQuestionComments.length - 1];

              reviewerComment.value = latestResponse.comment;
              selectedReviewerComment.value = latestResponse;
            } else {
              reviewerComment.value = "";
              selectedReviewerComment.value = { label: "", value: "" };
            }
          }
        });

        store
          .fetchProjectClientAnswers(projectId.value)
          .then((clientAnswerData) => {
            clientAnswers.value = clientAnswerData.map((answer) => ({
              label: `${answer.userEmail} - ${new Date(
                answer.timestamp
              ).toLocaleString()}`,
              value: answer.comment,
              timestamp: answer.timestamp,
              projectQuestionId: answer.projectQuestionId,
            }));

            const selectedQuestionAnswers =
              questionToClientAnswers.value[selected.value];
            if (selectedQuestionAnswers && selectedQuestionAnswers.length > 0) {
              const latestAnswer =
                selectedQuestionAnswers[selectedQuestionAnswers.length - 1];
              selectedClientAnswer.value = latestAnswer;
            } else {
              selectedClientAnswer.value = { label: "", value: "" };
            }
            document.addEventListener("keydown", handleArrowKeys);
            const onBeforeUnmount = () => {
              document.removeEventListener("keydown", handleArrowKeys);
            };
          });
      } catch (error) {
        console.error(error);
      }
    });

    const projectName = ref("Project Title");
    const totalQuestions = computed(() => {
      let count = 0;
      groups.value.forEach((group) => {
        count += group.children.length;
      });
      return count;
    });

    const clientToAnswer = computed(() => {
      let count = 0;
      flattenedNodes.value.forEach((node) => {
        const selectedQuestionAnswers = questionToClientAnswers.value[node.id];
        const selectedQuestionComments =
          questionToReviewerComments.value[node.id];

        // Get the latest answer and response
        const latestAnswer =
          selectedQuestionAnswers && selectedQuestionAnswers.length > 0
            ? selectedQuestionAnswers[selectedQuestionAnswers.length - 1]
            : null;
        const latestResponse =
          selectedQuestionComments && selectedQuestionComments.length > 0
            ? selectedQuestionComments[selectedQuestionComments.length - 1]
            : null;

        // Check if the answer timestamp is less than the response timestamp, or there is no client answer, and the question is not completed
        if (
          (latestAnswer === null ||
            (latestAnswer &&
              latestResponse &&
              new Date(latestAnswer.timestamp) <
                new Date(latestResponse.timestamp))) &&
          node.isCompleted != 1
        ) {
          count++;
        }
      });
      return count;
    });

    const ReviewerToRespond = computed(() => {
      let count = 0;
      flattenedNodes.value.forEach((node) => {
        const selectedQuestionAnswers = questionToClientAnswers.value[node.id];
        const selectedQuestionComments =
          questionToReviewerComments.value[node.id];

        // Get the latest answer and response
        const latestAnswer =
          selectedQuestionAnswers && selectedQuestionAnswers.length > 0
            ? selectedQuestionAnswers[selectedQuestionAnswers.length - 1]
            : null;
        const latestResponse =
          selectedQuestionComments && selectedQuestionComments.length > 0
            ? selectedQuestionComments[selectedQuestionComments.length - 1]
            : null;

        // Check if the answer timestamp is less than the response timestamp, or there is no client answer, and the question is not completed
        if (
          latestAnswer &&
          (!latestResponse ||
            new Date(latestAnswer.timestamp) >
              new Date(latestResponse.timestamp)) &&
          node.isCompleted != 1
        ) {
          count++;
        }
      });
      return count;
    });

    const status = ref("");
    store.installActions([
      {
        id: "export",
        label: "Export",
        submenu: [
          {
            label: "With reviewer comments",
            callback: () => {
              const htmlString = flattenedNodes.value
                .map((node) => {
                  const selectedQuestionAnswers =
                    questionToClientAnswers.value[node.id];
                  const selectedQuestionComments =
                    questionToReviewerComments.value[node.id];

                  const latestAnswer =
                    selectedQuestionAnswers &&
                    selectedQuestionAnswers.length > 0
                      ? selectedQuestionAnswers[
                          selectedQuestionAnswers.length - 1
                        ]
                      : null;
                  const latestResponse =
                    selectedQuestionComments &&
                    selectedQuestionComments.length > 0
                      ? selectedQuestionComments[
                          selectedQuestionComments.length - 1
                        ]
                      : null;

                  return `
                <div style="margin-bottom: 20px;">
                  <div style="border: 1px solid #1976D2; padding: 0px; max-width: 50%;">
                    <div style="background-color: #1976D2; color: #fff;">
                      <h3 style="margin: 0; padding: 10px 10px 10px 20px;">${
                        node.label
                      }</h3>
                    </div>
                    <p style="margin-top: 10px; padding-left: 20px;">${
                      node.description
                    }</p>
                  </div>
                  <div style="padding-left: 20px;">
                    <h4 style="margin-top: 20px;">Answer</h4>
                    <p>${latestAnswer ? latestAnswer.value : "No answer"}</p>
                    <hr />
                    <h4 style="margin-top: 20px;">Comment</h4>
                    <p>${latestResponse ? latestResponse.comment : ""}</p>
                  </div>
                </div>
              `;
                })
                .join("");

              const blob = new Blob([htmlString], { type: "text/html" });
              const url = URL.createObjectURL(blob);

              const link = document.createElement("a");
              link.href = url;
              link.download = "export_with_comments.html";
              link.click();
            },
          },
          {
            label: "Without reviewer comments",
            callback: () => {
              const htmlString = flattenedNodes.value
                .map((node) => {
                  const selectedQuestionAnswers =
                    questionToClientAnswers.value[node.id];

                  const latestAnswer =
                    selectedQuestionAnswers &&
                    selectedQuestionAnswers.length > 0
                      ? selectedQuestionAnswers[
                          selectedQuestionAnswers.length - 1
                        ]
                      : null;

                  return `
                <div style="margin-bottom: 20px;">
                  <div style="border: 1px solid #1976D2; padding: 0px; max-width: 50%;">
                    <div style="background-color: #1976D2; color: #fff;">
                      <h2 style="margin: 0; padding: 10px 10px 10px 20px;">${
                        node.label
                      }</h2>
                    </div>
                    <p style="margin-top: 10px; padding-left: 20px;">${
                      node.description
                    }</p>
                  </div>
                  <div style="padding-left: 20px;">
                    <h3 style="margin-top: 20px;">Answer</h3>
                    <p>${latestAnswer ? latestAnswer.value : "No answer"}</p>
                  </div>
                </div>
              `;
                })
                .join("");

              const blob = new Blob([htmlString], { type: "text/html" });
              const url = URL.createObjectURL(blob);

              const link = document.createElement("a");
              link.href = url;
              link.download = "export_without_comments.html";
              link.click();
            },
          },
        ],
      },
    ]);
    return {
      splitterModel,
      selected,
      groups,
      flattenedNodes,
      search,
      filteredQuestions,
      reviewerComment,
      clientAnswer,
      reviewerComments,
      clientAnswers,
      selectedReviewerComment,
      questionToClientAnswers,
      selectedQuestionAnswers,
      selectedClientAnswer,
      submit,
      nextQuestion,
      updateReviewerComment,
      updateClientAnswer,
      projectName,
      totalQuestions,
      clientToAnswer,
      filteredGroups,
      ReviewerToRespond,
      status,
      reviewerCommentsOptions,
      resetSearch,
      questionToReviewerComments,
      isLocked,
      isCompleted,
      currentFilter,
      filters,
      dropdown,
      applyFilter,
      handleArrowKeys,
      prevQuestion,
      onBeforeUnmount,
      toolbarConfig,
      fontsConfig,

      insertTable,
      dialog,
      tableRows,
      tableCols,
      toolbar,
    };
  },
};
</script>
<style>
.description-content img {
  max-width: 500px;
  height: auto;
}
</style>
<style scoped>
.q-editor::v-deep .q-editor__content table {
  border-collapse: collapse;
  width: 100%;
}

.q-editor::v-deep .q-editor__content table td {
  border: 1px solid black;
  padding: 10px;
}
</style>
