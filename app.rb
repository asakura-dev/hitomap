# -*- coding: utf-8 -*-
require 'sinatra'
require 'sinatra/json'
require 'sinatra/reloader' if development?
require 'twitter'
set :server, 'webrick'
set :port, 3000
set :bind, '0.0.0.0'
set :json_content_type, :js

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

get '/api/:screen_name' do
  client = Twitter::REST::Client.new do |config|
    config.consumer_key        = ""
    config.consumer_secret     = ""
    config.access_token        = ""
    config.access_token_secret = ""
  end

  begin
    user =  client.user(params[:screen_name])
  rescue => e
    return json data = { error: "error"}
  end
  data = {
    name: user.name,
    screen_name: user.screen_name,
    icon_url: user.profile_image_url,
    description: user.description,
    follow: user.friends_count,
    follower: user.followers_count,
    tweets: user.statuses_count
  }

  json data
end
