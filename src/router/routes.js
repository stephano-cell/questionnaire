import { useAppStore } from "../stores/appStore"; // adjust the path as needed

const routes = [
  {
    path: "",
    name: "login",
    component: () => import("pages/LoginPage.vue"),
    props: (route) => ({
      redirect: route.query.redirect,
    }),
  },
  {
    path: "/admin",
    component: () => import("layouts/AdminLayout.vue"),
    beforeEnter: (to, from, next) => {
      // Check if the user is authenticated and is an admin
      const store = useAppStore();
      if (store.authenticated && store.auth.type === "admin") {
        next();
      } else {
        // Redirect to the login page if the user is not an admin
        next("/login");
      }
    },
    children: [
      { path: "", component: () => import("pages/admin/IndexPage.vue") },
      {
        path: "user/list",
        component: () => import("pages/admin/ListUsers.vue"),
      },
      {
        path: "user/new",
        component: () => import("pages/admin/ViewUser.vue"),
        props: () => ({
          mode: "new",
        }),
      },
      {
        path: "user/edit/:id",
        component: () => import("pages/admin/ViewUser.vue"),
        props: (route) => ({
          mode: "edit",
          id: route.params.id,
        }),
      },
      {
        path: "project/list",
        component: () => import("pages/admin/ListProjects.vue"),
      },
      {
        path: "project/new",
        component: () => import("pages/admin/ViewProjects.vue"),
        props: () => ({
          mode: "new",
        }),
      },
      {
        path: "project/edit/:id",
        component: () => import("pages/admin/ViewProjects.vue"),
        props: (route) => ({
          mode: "edit",
          id: route.params.id,
        }),
      },
      {
        path: "project/review/:id",
        component: () => import("pages/admin/ReviewProject.vue"),
        props: (route) => ({
          id: route.params.id,
        }),
      },

      {
        path: "template/new",
        component: () => import("pages/admin/ViewTemplate.vue"),
        props: () => ({
          mode: "new",
        }),
      },
      {
        path: "template/edit/:id",
        component: () => import("pages/admin/ViewTemplate.vue"),
        props: (route) => ({
          mode: "edit",
          id: route.params.id,
        }),
      },
    ],
  },
  {
    path: "/session",
    component: () => import("layouts/ClientLayout.vue"),
    beforeEnter: (to, from, next) => {
      // Check if the user is authenticated and is a client
      const store = useAppStore();
      if (store.authenticated && store.auth.type === "client") {
        next();
      } else {
        // Redirect to the login page if the user is not a client
        next("/login");
      }
    },
    children: [
      {
        path: "",
        component: () => import("pages/client/ListProjectsClient.vue"),
      },
      {
        path: "answer",
        component: () => import("pages/client/AnswerProjectsClient.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
