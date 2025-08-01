import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import dotenv from "dotenv";

dotenv.config();

interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  token: string;
  tokenSecret: string;
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY as string,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET as string,
      callbackURL: process.env.TWITTER_CALLBACK_URL as string,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const userData = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          token,
          tokenSecret,
        };
        return done(null, userData);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);
