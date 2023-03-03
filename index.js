require("dotenv").config()
const express = require("express")
const app = express()
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

morgan.token("data", (req, res) => {
    if (Object.keys(req.body).length === 0) return
    return JSON.stringify(req.body);
})

app.use(morgan(":method :url :status :res[content-length] - :response-time ms :data"))


app.get("/info", (req, res) => {
    Person.countDocuments({}).then(count => {
        res.send(`<p>Phonebook has info for ${count} people</p>
        <p>${new Date()}</p>`)
    })
})

app.get("/api/persons", (req, res) => {
    Person.find({}).then(persons => {
        res.json(persons)
    })
})

app.get("/api/persons/:id", (req, res) => {
    Person.findById(req.params.id).then(person => {
        if (person) {
            res.json(person)
        } else {
            res.status(404).end()
        }
    })
    .catch(error => next(error))
})

app.delete("/api/persons/:id", (req, res, next) => {
    Person.findByIdAndRemove(req.params.id)
        .then(result => {
            res.status(204).end()
        })
        .catch(error => next(error))
})

app.post("/api/persons", (req, res, next) => {
    const body = req.body;

    if (!body.name) {
        return res.status(400).json({
            error: "name missing"
        })
    } else if (!body.number) {
        return res.status(400).json({
            error: "number missing"
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save()
        .then(savedPerson => {
            res.json(savedPerson)
        })
        .catch(error => next(error))
})

app.put("/api/persons/:id", (req, res, next) => {
    const {name, number} = req.body;


    Person.findByIdAndUpdate(
        req.params.id,
        {name, number}, {new: true, runValidators: true, context: "query"})
        .then(updatedPerson => {
            res.json(updatedPerson)
        })
        .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next)  => {
    console.log(error.message)

    if (error.name === 'CastError') {
        return res.status(400).send({ error: 'malformatted id' })
    } else if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})