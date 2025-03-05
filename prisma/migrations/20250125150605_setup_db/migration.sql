-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "chat" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(8) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "ophthalmologist_id" INTEGER,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "datetime" TIMESTAMP(6) NOT NULL,
    "description" VARCHAR(255),
    "va" JSONB,
    "photo" JSONB,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(32) NOT NULL,
    "last_name" VARCHAR(32) NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "password" VARCHAR(32) NOT NULL,
    "sex" VARCHAR(4) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "profile_picture" TEXT NOT NULL,
    "is_opthamologist" BOOLEAN NOT NULL,
    "status" VARCHAR(7) NOT NULL,
    "phone" JSONB,
    "email" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ophthalmologist_id_fkey" FOREIGN KEY ("ophthalmologist_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
