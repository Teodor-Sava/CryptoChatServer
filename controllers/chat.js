const Conversation = require('../models/conversation'),
  Message = require('../models/message'),
  User = require('../models/user');
const setUserInfo = require('../helpers').setUserInfo;

exports.getConversations = function (req, res, next) {
  // Only return one message from each conversation to display as snippet
  Conversation.find({ participants: req.user._id })
    .select('_id')
    .exec((err, conversations) => {
      if (err) {
        res.send({ error: err });
        return next(err);
      }

      // Set up empty array to hold conversations + most recent message
      const fullConversations = [];
      conversations.forEach((conversation) => {
        console.log(conversation);
        Message.find({ conversationId: conversation._id })
          .sort('-createdAt')
          .limit(1)
          .populate({
            path: 'author',
            select: 'profile.firstName profile.lastName'
          })
          .exec((err, message) => {
            if (err) {
              res.send({ error: 'No Conversations found' });
              return next(err);
            }
            fullConversations.push(message);
            if (fullConversations.length === conversations.length) {
              return res.status(200)
                .json({ conversations: fullConversations });
            }
          });
      });
    });
};
exports.getRecipients = function (req, res, next) {
  console.log(req);
  User.getChatRecipients((err, user) => {
    if (err) {
      throw err;
    }
    res.json(user);
  });
};
exports.getConversationUser = function (req, res, next) {
  console.log('req.params');
  console.log(req.params);
  let bla;
  Conversation.find({ _id: req.params.conversationId })
    .select('participants')
    .exec((err, conversation) => {
      if (err) {
        res.send({ error: err });
        return next(err);
      }
      bla = conversation[0].participants[1];
      console.log(bla);
      User.findById(bla, (err, user) => {
        if (err) {
          res.status(400)
            .json({ error: 'No user could be found for this ID.' });
          return next(err);
        }

        const userToReturn = setUserInfo(user);

        return res.status(200)
          .json({ user: userToReturn });
      });
    });

};

exports.getConversation = function (req, res, next) {
  let bla;
  let userToReturn;
  Conversation.find({ _id: req.params.conversationId })
    .select('participants')
    .exec((err, conversation) => {
      if (err) {
        res.send({ error: err });
        return next(err);
      }
      bla = conversation[0].participants[1];
      console.log(bla);
      User.findById(bla, (err, user) => {
        if (err) {
          res.status(400)
            .json({ error: 'No user could be found for this ID.' });
          return next(err);
        }

        userToReturn = setUserInfo(user);
        Message.find({ conversationId: req.params.conversationId })
          .select('createdAt body author')
          .sort('-createdAt')
          .populate({
            path: 'author',
            select: 'profile.firstName profile.lastName'
          })
          .exec((err, messages) => {
            if (err) {
              res.send({ error: err });
              return next(err);
            }

            return res.status(200)
              .json({ conversation: messages, user: userToReturn });
          });
      });
    });
};

exports.newConversation = function (req, res, next) {
  if (!req.params.recipient) {
    res.status(422)
      .send({ error: 'Please choose a valid recipient for your message.' });
    return next();
  }

  if (!req.body.composedMessage) {
    res.status(422)
      .send({ error: 'Please enter a message.' });
    return next();
  }

  const conversation = new Conversation({
    participants: [req.user._id, req.params.recipient]
  });

  conversation.save((err, newConversation) => {
    if (err) {
      res.send({ error: err });
      return next(err);
    }

    const message = new Message({
      conversationId: newConversation._id,
      body: req.body.composedMessage,
      author: req.user._id
    });

    message.save((err, newMessage) => {
      if (err) {
        res.send({ error: err });
        return next(err);
      }

      return res.status(200)
        .json({ message: 'Conversation started!', conversationId: conversation._id });
    });
  });
};

exports.sendReply = function (req, res, next) {
  const reply = new Message({
    conversationId: req.params.conversationId,
    body: req.body.composedMessage,
    author: req.user._id
  });

  reply.save((err, sentReply) => {
    if (err) {
      res.send({ error: err });
      return next(err);
    }

    return res.status(200)
      .json({ message: 'Reply successfully sent!' });
  });
};
