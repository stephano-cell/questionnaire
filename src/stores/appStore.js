import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
const axios = require("axios");

export const useAppStore = defineStore("appStore", {
  state: () => ({
    dynamicActions: [],
    auth: LocalStorage.getItem("auth") || null,
    usersData: [],
    templateGroups: [], // Add this state property
    templateQuestions: [], // Add this state property
    template: [],
  }),

  getters: {
    getActions() {
      var id = 1;
      const actions =
        this.dynamicActions?.map((a) => {
          a.id = id++;
          return a;
        }) ?? [];
      return actions;
    },
    authenticated() {
      console.log("Authenticated: " + (this.auth != null ? "yes" : "no"));
      return this.auth;
    },
    getUserEmail: (state) => (userId) => {
      const userOption = state.userOptions.find(
        (option) => option.value === userId
      );
      return userOption ? userOption.label : "";
    },
  },
  actions: {
    getUserByID(id) {
      const user = this.usersData.find((u) => u.id === id);
      if (!user) {
        return null;
      } else {
        return user;
      }
    },

    fetchUsers() {
      axios
        .get("http://localhost:3000/users")
        .then((response) => {
          this.usersData = response.data;
        })
        .catch((error) => {
          console.error("Error fetching users:", error);
        });
    },
    insertNewUser(user, selectedProjects) {
      // Create a new user and insert it into the database
      axios
        .post("http://localhost:3000/register", {
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          companyName: user.companyName,
          password: user.password,
          role: user.role,
          allowLogin: user.allowLogin,
        })
        .then((response) => {
          const userId = response.data.id;
          console.log("User created with ID:", userId);

          // Assign the selected projects to the new user if any projects are selected
          if (selectedProjects && selectedProjects.length > 0) {
            selectedProjects.forEach((projectId) => {
              // Renamed 'project' to 'projectId' for clarity
              axios
                .post("http://localhost:3000/assign", {
                  userId: userId,
                  projectId: projectId, // Use the project ID directly
                })
                .then(() => {
                  console.log(
                    `Project ${projectId} assigned to user ${userId}`
                  );
                })
                .catch((error) => {
                  console.error("Error assigning project:", error);
                });
            });
          }
        })
        .catch((error) => {
          console.error("Error creating user:", error);
        });
    },

    updateUser(userId, updatedUser) {
      console.log("User ID:", userId);
      axios
        .put(`http://localhost:3000/users/${userId}`, {
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          companyName: updatedUser.companyName,
          password: updatedUser.password,
          role: updatedUser.role,
          allowLogin: updatedUser.allowLogin,
        })
        .then((response) => {
          console.log("Server response:", response.data);
          console.log("User updated with ID:", response.data.id);
          // Update the usersData array in the store
          const index = this.usersData.findIndex((u) => u.id === userId);
          if (index !== -1) {
            this.usersData.splice(index, 1, response.data);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    },
    editUser(router, info) {
      router.push(`/admin/user/edit/${info.id}`);
    },

    mapUserRecords() {
      const usersData = this.usersData;

      return usersData.map((user) => {
        // Fetch the assigned projects for the user
        axios;

        return user;
      });
    },

    //templates

    fetchTemplates() {
      axios
        .get("http://localhost:3000/template/list")
        .then((response) => {
          console.log("Fetched templates:", response.data); // Add this line
          this.template = response.data;
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
        });
    },

    postNewTemplate(templateData) {
      console.log("Template Data:", templateData); // Add this line

      return axios
        .post("http://localhost:3000/template/new", templateData)
        .then((response) => {
          console.log("New template created with ID:", response.data.id);
          this.fetchTemplates(); // Fetch the templates again
          return { id: response.data.id }; // Return an object with the templateId
        })
        .catch((error) => {
          console.error("Error creating new template:", error);
        });
    },

    postNewGroup(groupData) {
      console.log("Group Data:", groupData); // Add this line

      return axios
        .post("http://localhost:3000/templateGroups/new", groupData)
        .then((response) => {
          console.log("New group created with ID:", response.data.id);
          return response; // make sure to return the response
        })
        .catch((error) => {
          console.error("Error creating new group:", error);
          return Promise.reject(error); // make sure to return a rejected Promise in case of an error
        });
    },

    postNewQuestion(questionData) {
      console.log("Question Data:", questionData); // Add this line

      return axios
        .post("http://localhost:3000/templateQuestions/new", questionData)
        .then((response) => {
          console.log("New question created with ID:", response.data.id);
          return response; // make sure to return the response
        })
        .catch((error) => {
          console.error("Error creating new question:", error);
          return Promise.reject(error); // make sure to return a rejected Promise in case of an error
        });
    },

    //editTemplate
    editTemplate(router, info) {
      router.push(`/admin/template/edit/${info.id}`);
    },
    async fetchTemplate(id) {
      return axios
        .get(`http://localhost:3000/template/${id}`)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching template:", error);
        });
    },

    async fetchTemplateGroups(templateId) {
      return axios
        .get(`http://localhost:3000/templateGroups/${templateId}`)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching template groups:", error);
        });
    },

    async fetchTemplateQuestions(groupId) {
      return axios
        .get(`http://localhost:3000/templateQuestions/${groupId}`)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          console.error("Error fetching template questions:", error);
        });
    },

    async updateTemplate(id, data) {
      await axios
        .put(`http://localhost:3000/template/${id}`, data)
        .then((response) => {
          console.log("Template updated with ID:", response.data.id);
        })
        .catch((error) => {
          console.error("Error updating template:", error);
        });
    },

    async updateGroup(id, data) {
      await axios
        .put(`http://localhost:3000/templateGroups/${id}`, data)
        .then((response) => {
          console.log("Group updated with ID:", response.data.id);
        })
        .catch((error) => {
          console.error("Error updating group:", error);
        });
    },

    async updateQuestion(id, data) {
      await axios
        .put(`http://localhost:3000/templateQuestions/${id}`, data)
        .then((response) => {
          console.log("Question updated with ID:", response.data.id);
        })
        .catch((error) => {
          console.error("Error updating question:", error);
        });
    },

    logout() {
      console.log("Logout");
      this.auth = null;
      LocalStorage.remove("auth");
    },

    authenticate(username, pass) {
      return axios
        .post("http://localhost:3000/login", {
          username: username,
          password: pass,
        })
        .then((response) => {
          const user = response.data;

          this.auth = {
            id: user.id,
            type: user.role,
            token: user.token,
          };

          LocalStorage.set("auth", this.auth);
        })
        .catch((error) => {
          console.error("Error:", error);
          this.auth = null;
        });
    },
    installActions(actions) {
      this.dynamicActions = actions ?? [];
    },
  },
});
