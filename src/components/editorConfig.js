// Define default values for toolbarConfig and fontsConfig
import { ref } from "vue"; // Import ref from the Vue Composition API

export const toolbarConfig = [
  ["bold", "italic", "strike", "underline"],
  [
    {
      label: "Default Font Size",
      icon: "format_size",
      fixedLabel: true,
      fixedIcon: true,
      list: "no-icons",
      options: [
        "size-1",
        "size-2",
        "size-3",
        "size-4",
        "size-5",
        "size-6",
        "size-7",
      ],
    },
    {
      label: "Default Font",
      icon: "format_font",
      fixedIcon: true,
      list: "no-icons",
      options: [
        "default_font",
        "arial",
        "arial_black",
        "comic_sans",
        "courier_new",
        "impact",
        "lucida_grande",
        "times_new_roman",
        "verdana",
      ],
    },
    "removeFormat",
  ],
  [
    {
      label: "Default Alignment",
      icon: "format_align_left",
      fixedLabel: true,
      list: "only-icons",
      options: ["left", "center", "right", "justify"],
    },
    "unordered",
    "ordered",
  ],
  ["undo", "redo"],
  ["fullscreen"],
];

export const fontsConfig = {
  arial: "Arial",
  arial_black: "Arial Black",
  comic_sans: "Comic Sans MS",
  courier_new: "Courier New",
  impact: "Impact",
  lucida_grande: "Lucida Grande",
  times_new_roman: "Times New Roman",
  verdana: "Verdana",
};
