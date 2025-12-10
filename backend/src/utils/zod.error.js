const zodError = ({ error }) => {
    return error.issues[0].message;
}

export default zodError