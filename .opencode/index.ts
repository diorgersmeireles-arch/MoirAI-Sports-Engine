import { defineSkill } from "@opencode-ai/plugin";

export const devolutivasAdmin = defineSkill({
  name: "devolutivas-admin",
  description:
    "Skill para tarefas administrativas do sistema de devolutivas escolares - gestão de alunos, login, senha",
  tools: [],
  agents: [],
  instructions: ".opencode/skills/devolutivas/admin/skill.md",
});

export const devolutivasTeacher = defineSkill({
  name: "devolutivas-teacher",
  description:
    "Skill para tarefas do professor - relatórios de devolutivas, gestão de alunos associados",
  tools: [],
  agents: [],
  instructions: ".opencode/skills/devolutivas/teacher/skill.md",
});

export const devolutivasBooking = defineSkill({
  name: "devolutivas-booking",
  description: "Skill para agendamento de reuniões - bookings, time slots, horários disponíveis",
  tools: [],
  agents: [],
  instructions: ".opencode/skills/devolutivas/booking/skill.md",
});

export const devolutivasDatabase = defineSkill({
  name: "devolutivas-database",
  description: "Skill para banco de dados Supabase - tipos, queries, autenticação",
  tools: [],
  agents: [],
  instructions: ".opencode/skills/devolutivas/database/skill.md",
});

export const devolutivas = defineSkill({
  name: "devolutivas",
  description:
    "Skill principal do sistema de devolutivas escolares j23 - inclui admin, teacher, booking e database",
  tools: [],
  agents: [devolutivasAdmin, devolutivasTeacher, devolutivasBooking, devolutivasDatabase],
  instructions: ".opencode/skills/devolutivas/skill.md",
});

export default { devolutivas };
