const { Todo } = require("../models");

exports.getAllTodos = async (req, res) => {
    const todos = await Todo.findAll({ where: { userId: 1 }, order: [["createdAt", "DESC"]] });
    res.json(todos);
}

exports.postTodo = async (req, res) => {
    const { task, dueDate } = req.body;
    const newTodo = await Todo.create({
        // hardcode userid for now
        userId: 1,
        task,
        dueDate: dueDate || null,
        completed: false,
    });
    res.json(newTodo);
}

exports.putTodo = async (req, res) => {
    const { completed } = req.body;
    const todo = await Todo.findByPk(req.params.id);
    if (!todo || todo.userId !== 1) return res.status(404).json({ error: "Not found" });

    await todo.update({ completed });
    res.json(todo);
}

exports.deleteTodo = async (req, res) => {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo || todo.userId !== 1) return res.status(404).json({ error: "Not found" });

    await todo.destroy();
    res.json({ success: true });
}