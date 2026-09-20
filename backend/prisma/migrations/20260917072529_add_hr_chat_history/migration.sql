-- CreateTable
CREATE TABLE "HrChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HrChatConversation_userId_updatedAt_idx" ON "HrChatConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "HrChatMessage_conversationId_createdAt_idx" ON "HrChatMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "HrChatConversation" ADD CONSTRAINT "HrChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrChatMessage" ADD CONSTRAINT "HrChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "HrChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
